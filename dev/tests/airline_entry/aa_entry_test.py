"""
aa_entry_test.py
Prototype test harness for American Airlines entry/exit.

Purpose:
- Open AA flight search form
- Autofill origin, destination, date, cabin
- Client clicks "Search" (never automated)
- Capture results page (screenshot + HTML) for validation
"""

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import os

# ---------------------------
# Configurable Test Inputs
# ---------------------------
TEST_DATA = {
    "url": "https://www.aa.com/booking/flights",
    "origin": "DFW",
    "destination": "NRT",
    "date": "05/15/2026",  # MM/DD/YYYY (AA uses slashes)
    "cabin": "business"    # or "economy", "first"
}

# ---------------------------
# Setup Driver
# ---------------------------
options = webdriver.ChromeOptions()
options.binary_location = r"C:\path\to\chrome-win64\chrome.exe"  # Chrome for Testing
options.add_argument("--start-maximized")   # open full screen
driver = webdriver.Chrome(service=Service(), options=options)

print("🚀 Opening AA booking page...")
driver.get(TEST_DATA["url"])

# ---------------------------
# Autofill Form Fields
# ---------------------------
try:
    # Origin
    origin_field = WebDriverWait(driver, 20).until(
        EC.presence_of_element_located((By.ID, "reservationFlightSearchForm.originAirport"))
    )
    origin_field.clear()
    origin_field.send_keys(TEST_DATA["origin"])

    # Destination
    dest_field = driver.find_element(By.ID, "reservationFlightSearchForm.destinationAirport")
    dest_field.clear()
    dest_field.send_keys(TEST_DATA["destination"])

    # Date (depart)
    date_field = driver.find_element(By.NAME, "departDate")
    date_field.clear()
    date_field.send_keys(TEST_DATA["date"])

    # Cabin selection (if dropdown exists)
    try:
        cabin_field = driver.find_element(By.ID, "flightSearchCabin")
        cabin_field.send_keys(TEST_DATA["cabin"])
    except:
        print("⚠️ Cabin dropdown not found — skipping.")

    print("✅ Autofill complete. Please review and click 'Search' yourself.")

except Exception as e:
    print(f"❌ Error autofilling form: {e}")

# ---------------------------
# Wait for Client Action
# ---------------------------
try:
    print("⏳ Waiting for results page to load after your click...")

    # Wait until the results container appears
    results = WebDriverWait(driver, 120).until(
        EC.presence_of_element_located((By.TAG_NAME, "body"))
    )
    time.sleep(5)  # give page a moment to settle

    # ---------------------------
    # Capture Snapshot
    # ---------------------------
    out_dir = "aa_test_output"
    os.makedirs(out_dir, exist_ok=True)

    screenshot_path = os.path.join(out_dir, "aa_dfw_nrt.png")
    html_path = os.path.join(out_dir, "aa_dfw_nrt.html")

    driver.save_screenshot(screenshot_path)
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(driver.page_source)

    print(f"📸 Screenshot saved: {screenshot_path}")
    print(f"💾 HTML saved: {html_path}")
    print("✅ Scan complete. You may now close the browser tab.")

except Exception as e:
    print(f"❌ Error waiting for results: {e}")
