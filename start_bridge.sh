#!/bin/bash

cd "$(dirname "$0")"

if [ ! -f .env ]; then
    cp .env.example .env
fi

pip install -r src/bridge/requirements.txt

python src/bridge/main.py