#!/bin/bash
# Generate PDF using Chrome headless mode with better formatting

HTML_FILE="resources/top-5-interference.html"
PDF_FILE="resources/top-5-interference.pdf"
CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

# Convert to absolute paths
HTML_ABS=$(cd "$(dirname "$HTML_FILE")" && pwd)/$(basename "$HTML_FILE")
PDF_ABS=$(cd "$(dirname "$PDF_FILE")" && pwd)/$(basename "$PDF_FILE")

# Generate PDF using Chrome with print options
"$CHROME_PATH" --headless \
    --disable-gpu \
    --run-all-compositor-stages-before-draw \
    --virtual-time-budget=2000 \
    --print-to-pdf="$PDF_ABS" \
    --print-to-pdf-no-header \
    --no-pdf-header-footer \
    "file://$HTML_ABS" 2>/dev/null

if [ -f "$PDF_ABS" ]; then
    echo "PDF generated successfully: $PDF_ABS"
    # Check PDF page count
    PAGES=$(mdls -name kMDItemNumberOfPages "$PDF_ABS" 2>/dev/null | awk '{print $3}' || echo "unknown")
    echo "PDF pages: $PAGES"
    exit 0
else
    echo "Error: PDF generation failed"
    exit 1
fi
