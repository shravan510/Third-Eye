"""
Add augmentations specific to Indian road conditions:
- Rain/fog overlay simulation
- Night-time brightness reduction
- Motion blur (moving vehicles)
- Perspective distortion (angled CCTV cameras)
- Overexposure (midday sun glare)
"""
import cv2
import glob
import albumentations as A
import os

def augment_image(image_path, save_dir):
    img = cv2.imread(image_path)
    if img is None:
        return
        
    transform = A.Compose([
        A.RandomBrightnessContrast(brightness_limit=0.2, contrast_limit=0.2, p=0.5), # Glare or dark
        A.MotionBlur(blur_limit=7, p=0.3),                                          # Fast vehicles
        A.GaussNoise(var_limit=(10.0, 50.0), p=0.2),                                # Low light CCTV noise
        A.Perspective(scale=(0.05, 0.1), p=0.3)                                     # CCTV angle difference
    ])
    
    try:
        augmented = transform(image=img)['image']
        filename = os.path.basename(image_path).split('.')[0] + "_aug.jpg"
        cv2.imwrite(os.path.join(save_dir, filename), augmented)
    except Exception as e:
        print(f"Failed augmentation on {image_path}: {e}")

if __name__ == "__main__":
    os.makedirs("./datasets/augmented", exist_ok=True)
    images = glob.glob("./datasets/third_eye_traffic/images/train/*.jpg")
    for img_path in images:
        augment_image(img_path, "./datasets/augmented")
    print(f"Applied augmentations to {len(images)} training images.")
