# 🧠 Training the YOLO26 Model

YOLO26-Nano comes pre-trained on generic datasets (COCO). However, Sangli/Indian roads look unique (specifically Auto Rickshaws, Indian Bikes, License plates, environment clutter).

## Steps to Re-Train

*Use the HP Victus (RTX 2050)* for training since it provides strong CUDA acceleration taking a mere couple hours compared to ASUS running 24+ CPU hours.

```bash
# Prepare Datasets
cd training

# Downloads images (500+) into /training/datasets/third_eye_traffic/

# Split Datasets (Train/Val/Test)
python 2_dataset_preparation.py

# Simulate weather and blur conditions
python 3_data_augmentation.py

# Initiate Training Scripts 
# (YOLO automatically compiles best.pt weights to runs/train)
python 4_train.py

# Execute evaluations over testing datasets ensuring Model passes
python 5_evaluate.py
```

## Porting the Finished Weights

1. Navigate to `/training/runs/train/third_eye_v1/weights/`.
2. Extract the file `best.pt`.
3. Erase the default `yolo26n.pt` within `/ai_engine/` and swap it out for the revalidated `best.pt` file. Reboot all services.
