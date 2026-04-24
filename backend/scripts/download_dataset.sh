#!/bin/bash

# Directories
DATASET_DIR="dataset"
LOOKUP_DIR="lookups"

# Create directories if they don't exist
mkdir -p "$DATASET_DIR"
mkdir -p "$LOOKUP_DIR"

# Base URL provided by OpenDOSM
BASE_URL="https://storage.data.gov.my/pricecatcher"

echo "Starting download of PriceCatcher datasets (Jan 2022 - April 2026)..."

for year in {2022..2026}; do
  for month in {01..12}; do
    
    # Condition to stop after April 2026
    if [[ "$year" -eq 2026 && "$month" -gt "04" ]]; then
      break
    fi

    FILENAME="pricecatcher_${year}-${month}.parquet"
    URL="${BASE_URL}/${FILENAME}"
    OUTPUT_FILE="${DATASET_DIR}/${FILENAME}"

    # -f: Fail silently (no file created if 404)
    # -L: Follow any redirects
    # -o: Save file with specified name
    # -C -: Resume download if interrupted
    if curl -fLo "$OUTPUT_FILE" -C - "$URL"; then
        echo "Successfully downloaded: $FILENAME"
    else
        echo "Skipped: $FILENAME (File may not exist on server)"
    fi
    
  done
done

echo "Downloading lookup files..."
curl -fLo "${LOOKUP_DIR}/lookup_premise.parquet" -C - "${BASE_URL}/lookup_premise.parquet"
curl -fLo "${LOOKUP_DIR}/lookup_item.parquet" -C - "${BASE_URL}/lookup_item.parquet"

echo "Download process complete."
