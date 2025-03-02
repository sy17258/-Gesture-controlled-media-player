import cv2
import mediapipe as mp
import time
import subprocess
import pyautogui
import platform

class HandDetector:
    def __init__(self, mode=False, maxHands=2, detectionCon=0.5, trackCon=0.5):
        self.mode = mode
        self.maxHands = maxHands
        self.detectionCon = detectionCon
        self.trackCon = trackCon

        self.mpHands = mp.solutions.hands
        self.hands = self.mpHands.Hands(
            static_image_mode=self.mode,
            max_num_hands=self.maxHands,
            min_detection_confidence=self.detectionCon,
            min_tracking_confidence=self.trackCon
        )
        self.mpDraw = mp.solutions.drawing_utils
        self.tipIds = [4, 8, 12, 16, 20]

    def findHands(self, img, draw=True):
        imgRGB = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        self.results = self.hands.process(imgRGB)
        
        if self.results.multi_hand_landmarks:
            for handLms in self.results.multi_hand_landmarks:
                if draw:
                    self.mpDraw.draw_landmarks(
                        img, handLms, self.mpHands.HAND_CONNECTIONS)
        return img

    def findPosition(self, img, handNo=0, draw=True):
        self.lmList = []
        self.handedness = []
        if self.results.multi_hand_landmarks:
            for hand in self.results.multi_handedness:
                self.handedness.append(hand.classification[0].label)
            
            myHand = self.results.multi_hand_landmarks[handNo]
            for id, lm in enumerate(myHand.landmark):
                h, w, c = img.shape
                cx, cy = int(lm.x * w), int(lm.y * h)
                self.lmList.append([id, cx, cy])
                if draw:
                    cv2.circle(img, (cx, cy), 7, (255, 0, 0), cv2.FILLED)
        return self.lmList, self.handedness

    def fingersUp(self):
        fingers = []
        # Thumb
        if self.lmList[self.tipIds[0]][1] < self.lmList[self.tipIds[0] - 1][1]:
            fingers.append(1)
        else:
            fingers.append(0)
        # Other fingers
        for id in range(1, 5):
            if self.lmList[self.tipIds[id]][2] < self.lmList[self.tipIds[id] - 2][2]:
                fingers.append(1)
            else:
                fingers.append(0)
        return fingers

class AppController:
    def __init__(self):
        self.os_type = platform.system()
        self.file_manager_open = False
        self.vlc_open = False
        self.file_selected = False
        self.last_palm_time = 0

    def open_vlc(self):
        try:
            if self.os_type == 'Darwin':
                subprocess.Popen(['open', '-a', 'VLC'])
            else:
                subprocess.Popen(r'C:\Program Files\VideoLAN\VLC\vlc.exe')
            self.vlc_open = True
            print("VLC opened")
        except Exception as e:
            print("Error opening VLC:", e)

    def open_file_manager(self):
        try:
            if self.os_type == 'Darwin':
                subprocess.Popen(['open', '/System/Library/CoreServices/Finder.app'])
            else:
                subprocess.Popen(r'explorer.exe')
            self.file_manager_open = True
            print("File Manager opened")
        except Exception as e:
            print("Error opening File Manager:", e)

    def control_media(self, fingers):
        if sum(fingers) == 1:
            pyautogui.press('volumeup')
        elif sum(fingers) == 2:
            pyautogui.press('volumedown')
        elif sum(fingers) == 3:
            pyautogui.press('playpause')
        elif sum(fingers) == 4:
            pyautogui.press('nexttrack')
        elif sum(fingers) == 5:
            pyautogui.press('prevtrack')

    def handle_palm_gesture(self):
        current_time = time.time()
        if current_time - self.last_palm_time > 2:  # 2-second cooldown
            pyautogui.press('enter')
            self.file_selected = True
            print("File selected with palm gesture")
            self.last_palm_time = current_time

def main():
    cap = cv2.VideoCapture(0)
    detector = HandDetector()
    controller = AppController()
    last_action_time = 0
    action_delay = 2  # seconds

    while True:
        success, img = cap.read()
        if not success:
            break

        img = detector.findHands(img)
        lmList, handedness = detector.findPosition(img, draw=False)
        
        if len(lmList) != 0 and len(handedness) != 0:
            fingers = detector.fingersUp()
            current_time = time.time()

            # Left Hand Controls (App Launch)
            if 'Left' in handedness:
                left_fingers = fingers
                if sum(left_fingers) == 2 and (current_time - last_action_time) > action_delay:
                    controller.open_vlc()
                    last_action_time = current_time
                elif sum(left_fingers) == 3 and (current_time - last_action_time) > action_delay:
                    controller.open_file_manager()
                    last_action_time = current_time

            # Right Hand Controls
            if 'Right' in handedness:
                right_fingers = fingers
                if controller.file_manager_open:
                    thumb_y = lmList[4][2]
                    screen_height = pyautogui.size().height
                    
                    # File navigation
                    if thumb_y < screen_height // 3:
                        pyautogui.press('up')
                    elif thumb_y > 2 * screen_height // 3:
                        pyautogui.press('down')
                    
                    # Palm gesture confirmation (all fingers up)
                    if sum(right_fingers) == 5:
                        controller.handle_palm_gesture()
                
                if controller.vlc_open and controller.file_selected:
                    controller.control_media(right_fingers)

        cv2.imshow("Hand Controller", img)
        if cv2.waitKey(1) == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
    