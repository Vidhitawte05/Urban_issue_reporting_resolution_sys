from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
from PIL import Image
import io

# Load YOLOv8 model
model = YOLO("best.pt")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    contents = await file.read()
    image = Image.open(io.BytesIO(contents))

    # Run inference
    results = model.predict(image)

    detected = False
    for r in results:  # iterate over Results objects
        for box in r.boxes:
            cls_id = int(box.cls[0])  # class index
            label = model.names[cls_id]  # get class name from model
            if label.lower() == "pothole":  # check if pothole detected
                detected = True

    return {"pothole_detected": detected}
