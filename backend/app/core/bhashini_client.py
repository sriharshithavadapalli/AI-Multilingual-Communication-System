"""
Client for Bhashini (bhashini.gov.in) — the Government of India's National
Language Translation Mission API. Purpose-built for translation between
Indian languages, as opposed to a general-purpose LLM.

Setup (free):
  1. Register at https://bhashini.gov.in/ulca/user/register
  2. Verify your email, then log in at https://bhashini.gov.in/ulca/user/login
  3. Go to "My Profile" and generate an API Key
  4. Copy your User ID and ULCA API Key, then set these environment variables
     before starting the backend:
       BHASHINI_USER_ID=<your user id>
       BHASHINI_API_KEY=<your ulca api key>

How it works (three-step flow per the Bhashini API spec):
  1. Pipeline Config Call — given a source/target language pair, asks Bhashini
     which model (serviceId) to use, and where to send the actual translation
     request (callbackUrl + auth header). Cached per language pair so we don't
     repeat this call on every translation.
  2. Pipeline Compute Call — sends the actual text to the callbackUrl returned
     above, using the serviceId and auth header from step 1.
"""
import os
from typing import Optional

import requests
from fastapi import HTTPException

ULCA_CONFIG_URL = "https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelsPipeline"
# Standard MeitY pipeline ID used for general-purpose translation pipelines.
DEFAULT_PIPELINE_ID = "64392f96daac500b55c543cd"

# Bhashini uses ISO-639 language codes. Map the human-readable language names
# used elsewhere in this app to the codes Bhashini expects.
LANGUAGE_CODES = {
    "english": "en", "hindi": "hi", "marathi": "mr", "tamil": "ta",
    "telugu": "te", "kannada": "kn", "malayalam": "ml", "bengali": "bn",
    "gujarati": "gu", "punjabi": "pa", "odia": "or", "urdu": "ur",
    "assamese": "as", "nepali": "ne", "sanskrit": "sa", "konkani": "kok",
    "manipuri": "mni", "bodo": "brx", "santali": "sat", "maithili": "mai",
    "dogri": "doi", "kashmiri": "ks", "sindhi": "sd",
}

# In-memory cache of pipeline config per (source_code, target_code) pair, so
# repeated translations between the same language pair skip the config call.
_pipeline_cache = {}


def _lang_code(language_name: str) -> str:
    code = LANGUAGE_CODES.get(language_name.strip().lower())
    if not code:
        raise HTTPException(
            status_code=400,
            detail=f"'{language_name}' is not a recognized Indic language for Bhashini. "
                   f"Supported: {', '.join(sorted(n.title() for n in LANGUAGE_CODES))}.",
        )
    return code


def _get_credentials():
    user_id = os.environ.get("BHASHINI_USER_ID")
    api_key = os.environ.get("BHASHINI_API_KEY")
    if not user_id or not api_key:
        raise HTTPException(
            status_code=500,
            detail="BHASHINI_USER_ID and BHASHINI_API_KEY are not set. Register for free at "
                   "https://bhashini.gov.in/ulca/user/register, generate an API key from "
                   "'My Profile', and set both environment variables before using this feature.",
        )
    return user_id, api_key


def _get_pipeline_config(source_code: str, target_code: str) -> dict:
    cache_key = (source_code, target_code)
    if cache_key in _pipeline_cache:
        return _pipeline_cache[cache_key]

    user_id, api_key = _get_credentials()
    body = {
        "pipelineTasks": [
            {
                "taskType": "translation",
                "config": {"language": {"sourceLanguage": source_code, "targetLanguage": target_code}},
            }
        ],
        "pipelineRequestConfig": {"pipelineId": DEFAULT_PIPELINE_ID},
    }
    try:
        resp = requests.post(
            ULCA_CONFIG_URL,
            json=body,
            headers={"userID": user_id, "ulcaApiKey": api_key},
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()
    except requests.RequestException as e:
        raise HTTPException(status_code=502, detail=f"Bhashini config call failed: {str(e)}")

    try:
        service_id = data["pipelineResponseConfig"][0]["config"][0]["serviceId"]
        endpoint = data["pipelineInferenceAPIEndPoint"]
        callback_url = endpoint["callbackUrl"]
        auth_name = endpoint["inferenceApiKey"]["name"]
        auth_value = endpoint["inferenceApiKey"]["value"]
    except (KeyError, IndexError):
        raise HTTPException(
            status_code=502,
            detail=f"Bhashini did not return a usable pipeline for {source_code} → {target_code}. "
                   "This language pair may not be supported.",
        )

    config = {
        "service_id": service_id,
        "callback_url": callback_url,
        "auth_name": auth_name,
        "auth_value": auth_value,
    }
    _pipeline_cache[cache_key] = config
    return config


def translate_via_bhashini(text: str, source_language: str, target_language: str) -> str:
    """Translate text using Bhashini's dedicated Indic NMT models."""
    source_code = _lang_code(source_language)
    target_code = _lang_code(target_language)

    if source_code == target_code:
        return text

    config = _get_pipeline_config(source_code, target_code)

    body = {
        "pipelineTasks": [
            {
                "taskType": "translation",
                "config": {
                    "language": {"sourceLanguage": source_code, "targetLanguage": target_code},
                    "serviceId": config["service_id"],
                },
            }
        ],
        "inputData": {"input": [{"source": text}]},
    }
    try:
        resp = requests.post(
            config["callback_url"],
            json=body,
            headers={config["auth_name"]: config["auth_value"], "Content-Type": "application/json"},
            timeout=20,
        )
        resp.raise_for_status()
        data = resp.json()
    except requests.RequestException as e:
        raise HTTPException(status_code=502, detail=f"Bhashini translation call failed: {str(e)}")

    try:
        return data["pipelineResponse"][0]["output"][0]["target"]
    except (KeyError, IndexError):
        raise HTTPException(status_code=502, detail="Bhashini returned an unexpected response format.")
