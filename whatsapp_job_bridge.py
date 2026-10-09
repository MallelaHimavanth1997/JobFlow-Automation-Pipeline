import os
import time
import re
import requests
import atexit
from datetime import datetime
from zoneinfo import ZoneInfo
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# --- CONFIGURATION ---
GROUP_NAME = "Data Eng REQ ( Himavanth )"
WEBAPP_URL = "https://script.google.com/macros/s/AKfycbyg99x7PbtfhlglNyfhgiLwXzdbrEsPVDC2smNJRtTyQHSbLUXzU-vwxQewdC4ac1p7/exec"
TIMEZONE = ZoneInfo("America/Chicago")
START_HOUR = 8   
END_HOUR = 24    
# ---------------------

driver = None

def cleanup():
    global driver
    if driver:
        try:
            print("\n[CLEANUP] Closing automated Chrome session...")
            driver.quit()
            print("[CLEANUP] Session terminated cleanly.")
        except:
            pass

atexit.register(cleanup)

def is_within_operating_hours():
    now = datetime.now(TIMEZONE)
    return START_HOUR <= now.hour < END_HOUR

def main():
    global driver
    
    print("\n" + "=" * 60)
    print(f"[{datetime.now(TIMEZONE).strftime('%I:%M %p')}] Starting WhatsApp Job Bridge (DEEP DEBUG MODE)...")
    print("=" * 60)
    
    chrome_options = Options()
    profile_path = os.path.join(os.getcwd(), "whatsapp_session")
    chrome_options.add_argument(f"user-data-dir={profile_path}")
    
    try:
        driver = webdriver.Chrome(options=chrome_options)
        driver.get("https://web.whatsapp.com/")
        
        print("\nWaiting for WhatsApp to load...")
        search_box = WebDriverWait(driver, 90).until(
            EC.presence_of_element_located((By.XPATH, '//div[@contenteditable="true"]'))
        )
        
        print(f"Locating group: {GROUP_NAME}...")
        search_box.clear()
        search_box.send_keys(GROUP_NAME)
        time.sleep(3)
        
        group_element = WebDriverWait(driver, 15).until(
            EC.element_to_be_clickable((By.XPATH, f'//span[contains(@title, "{GROUP_NAME}")]'))
        )
        group_element.click()
        
        time.sleep(2)
        driver.minimize_window()
        print("Browser minimized. Listening for requirements...\n")
        
        last_message_text = ""
        email_regex = r'[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+'
        loop_counter = 0
        
        while True:
            try:
                if not is_within_operating_hours():
                    print(f"[{datetime.now(TIMEZONE).strftime('%I:%M %p')}] Outside operating hours. Sleeping...")
                    time.sleep(900)
                    continue

                messages = driver.find_elements(By.CSS_SELECTOR, 'div[role="row"]')
                
                if messages:
                    last_message_element = messages[-1]
                    
                    # 1. Automatically click "Read more" if the message is long and hidden
                    try:
                        read_more_btn = last_message_element.find_element(By.XPATH, './/*[text()="Read more"]')
                        driver.execute_script("arguments[0].click();", read_more_btn)
                        time.sleep(0.5) # Give it a half-second to expand the text
                    except:
                        pass # No "Read more" button found, proceed normally
                        
                    # 2. Now extract the fully expanded text
                    current_message = last_message_element.text.strip()
                    
                    if current_message and current_message != last_message_text:
                        last_message_text = current_message
                        
                        email_match = re.search(email_regex, current_message)
                        
                        if email_match:
                            recruiter_email = email_match.group(0)
                            print("\n" + "=" * 50)
                            print(f"[{datetime.now(TIMEZONE).strftime('%I:%M %p')}] 🔥 NEW REQUIREMENT DETECTED!")
                            print(f"📧 Recruiter Email: {recruiter_email}")
                            
                            payload = {
                                "email": recruiter_email,
                                "text": current_message
                            }
                            try:
                                response = requests.post(WEBAPP_URL, json=payload)
                                if response.status_code == 200:
                                    print("✅ Gmail Draft Created Successfully!")
                                else:
                                    print(f"⚠️ Webhook responded with status: {response.status_code}")
                            except Exception as web_err:
                                print(f"❌ Failed to trigger webhook: {web_err}")
                                
                            print("=" * 50 + "\n")
                        else:
                            # This just prints a short preview to the console to keep it clean
                            clean_preview = current_message.replace("\n", " ")[:60]
                            print(f"[{datetime.now(TIMEZONE).strftime('%I:%M %p')} DEBUG] Read full message, no email found. Preview: {clean_preview}...")
                
                loop_counter += 1
                if loop_counter % 10 == 0:
                    print(f"[{datetime.now(TIMEZONE).strftime('%I:%M %p')} HEARTBEAT] Still actively monitoring... Found {len(messages)} messages on screen.")
                    
                time.sleep(3)
                
            except Exception as e:
                print(f"[{datetime.now(TIMEZONE).strftime('%I:%M %p')} LOOP ERROR] {e}")
                time.sleep(5)
                
    except KeyboardInterrupt:
        print("\n[STOP] Termination signal received (Ctrl+C).")
    except Exception as err:
        print(f"\n[FATAL ERROR]: {err}")

if __name__ == "__main__":
    main()