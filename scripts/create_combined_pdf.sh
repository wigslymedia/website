#!/bin/bash
# Create a combined PDF with both landing page and success page

cd "$(dirname "$0")"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

echo "Generating PDFs..."

# Ensure resources directory exists
mkdir -p resources

# Generate PDF for landing page
"$CHROME" --headless --disable-gpu \
  --print-to-pdf=resources/landing-page.pdf \
  --print-to-pdf-no-header \
  --virtual-time-budget=5000 \
  "file://$(pwd)/index.html" 2>/dev/null

# Generate PDF for success page  
"$CHROME" --headless --disable-gpu \
  --print-to-pdf=resources/success-page.pdf \
  --print-to-pdf-no-header \
  --virtual-time-budget=3000 \
  "file://$(pwd)/success.html" 2>/dev/null

# Combine PDFs using Python (if available) or just keep separate
if command -v python3 &> /dev/null; then
    python3 << 'EOF'
from PyPDF2 import PdfMerger
import os

merger = PdfMerger()
if os.path.exists('resources/landing-page.pdf'):
    merger.append('resources/landing-page.pdf')
if os.path.exists('resources/success-page.pdf'):
    merger.append('resources/success-page.pdf')

merger.write('resources/complete-landing-page.pdf')
merger.close()
print("Combined PDF created: resources/complete-landing-page.pdf")
EOF
else
    echo "Individual PDFs created:"
    echo "  - resources/landing-page.pdf (main page)"
    echo "  - resources/success-page.pdf (thank you page)"
    echo ""
    echo "To combine, install PyPDF2: pip3 install PyPDF2"
fi

echo "Done!"

