import os
import shutil
from pathlib import Path
import random

# Place your raw downloaded dataset in ./raw_data
# This script organizes it into Train/Val/Test for YOLO format

def split_dataset(source_dir, output_dir, train_ratio=0.8, val_ratio=0.1, test_ratio=0.1):
    source_path = Path(source_dir)
    images_dir = source_path / "images"
    labels_dir = source_path / "labels"
    
    if not images_dir.exists() or not labels_dir.exists():
        print("Data source must contain 'images' and 'labels' directories.")
        return

    all_images = list(images_dir.glob("*.jpg")) + list(images_dir.glob("*.png"))
    random.shuffle(all_images)
    
    train_end = int(len(all_images) * train_ratio)
    val_end = train_end + int(len(all_images) * val_ratio)
    
    splits = {
        'train': all_images[:train_end],
        'val': all_images[train_end:val_end],
        'test': all_images[val_end:]
    }
    
    for split, img_list in splits.items():
        out_img_dir = Path(output_dir) / "images" / split
        out_lbl_dir = Path(output_dir) / "labels" / split
        out_img_dir.mkdir(parents=True, exist_ok=True)
        out_lbl_dir.mkdir(parents=True, exist_ok=True)
        
        for img_path in img_list:
            lbl_name = img_path.stem + ".txt"
            lbl_path = labels_dir / lbl_name
            if lbl_path.exists():
                shutil.copy(img_path, out_img_dir / img_path.name)
                shutil.copy(lbl_path, out_lbl_dir / lbl_name)
    
    print("Dataset successfully prepared in", output_dir)

if __name__ == "__main__":
    split_dataset("./raw_data", "./datasets/third_eye_traffic")
