#!/bin/bash
docker rm -f web_cereal
docker build -t web_cereal .
docker run --network=host --name=web_cereal --rm -p 5004:5004 -it web_cereal