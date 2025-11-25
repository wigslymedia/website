#!/usr/bin/env python3
"""Generate PDF from the landing page HTML"""

from playwright.sync_api import sync_playwright
import os

def generate_pdf():
    html_file = os.path.abspath('resources/top-5-interference.html')
    pdf_file = os.path.abspath('resources/top-5-interference.pdf')
    
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        # Load the HTML file
        page.goto(f'file://{html_file}')
        
        # Wait for page to load
        page.wait_for_load_state('networkidle')
        
        # Generate PDF
        page.pdf(
            path=pdf_file,
            format='A4',
            print_background=True,
            margin={
                'top': '20mm',
                'right': '15mm',
                'bottom': '20mm',
                'left': '15mm'
            }
        )
        
        browser.close()
        print(f"PDF generated successfully: {pdf_file}")

if __name__ == '__main__':
    generate_pdf()

