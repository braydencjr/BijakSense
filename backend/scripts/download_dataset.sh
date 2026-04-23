#!/bin/bash

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

    # -f: Fail silently (no file created if 404)
    # -L: Follow any redirects
    # -O: Save file with its remote name
    # -C -: Resume download if interrupted
    if curl -fLOC - "$URL"; then
        echo "Successfully downloaded: $FILENAME"
    else
        echo "Skipped: $FILENAME (File may not exist on server)"
    fi
    
  done
done

echo "Download process complete."
