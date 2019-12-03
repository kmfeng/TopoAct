#!/bin/bash

# Copy and execute the command below in the top-level directory that contains the layer folders

for d in */; do (
  cd "$d";
  jq -c . <output.json >output.json.min;
  rm output.json;
  mv output.json.min output.json;
); done
