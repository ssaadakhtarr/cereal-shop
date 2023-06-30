#!/bin/bash
docker rm -f web_cereal
docker build -t web_cereal .
docker run --network=host --name=web_cereal --rm -p 5000:5000 -it web_cereal