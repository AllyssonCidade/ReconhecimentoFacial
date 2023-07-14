const cam = document.getElementById('cam')

const startVideo = () => {

    navigator.mediaDevices.enumerateDevices()
        .then(devices => {
            if (Array.isArray(devices)) {
                devices.forEach(device => {
                    if (device.kind == 'videoinput') {
                        if (device.label.includes('')) {
                            navigator.getUserMedia(
                                {
                                    video: {
                                        deviceId: device.deviceId
                                    }
                                },
                                stream => cam.srcObject = stream,
                                error => console.log(error)
                            )
                        }
                    }
                })
            }
        })
}

const loadLabels = () => {
    const labels = ['Allysson Cidade']
    return Promisses.all(labels.map(async label => {
        const descriptions = []
        for (let i = 1; i < 5; i++) {
            const img = await faceapi.fetchImage('/assets/lib/labels/${label}/${i}.jpg')
            const detections = await faceapi.
                detectSingleFace(img)
                .widthFaceLandmarks()
                .widthFaceDesciptior()
            descriptions.push(detections.descriptor)
        }
        return new faceapi.labeledFaceDescriptors(label, descriptions)
    }))
}
Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('/assets/lib/face-api/models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('/assets/lib/face-api/models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('/assets/lib/face-api/models'),
    faceapi.nets.faceExpressionNet.loadFromUri('/assets/lib/face-api/models'),
    faceapi.nets.ageGenderNet.loadFromUri('/assets/lib/face-api/models'),
    faceapi.nets.ssdMobilenetv1.loadFromUri('/assets/lib/face-api/models'),
]).then(startVideo)


cam.addEventListener('play', async () => {
    const canvas = faceapi.creatCanvasFromMedia(cam);
    canvasSize = {
        width: cam.width,
        height: cam.height
    }
    const labels = await loadLabels()
    faceapi.matchDimensions(canvas, canvasSize)
    document.body.appendChild(canvas);
    setInterval(async () => {
        const detections = await faceapi
            .detectAllFaces(
                cam,
                new faceApi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceExpressions()
            .withAgeAndGender()
            .withFaceDesciptiors()
        const recizedDetections = faceapi.reciseResults(detections, canvasSize)
        const faceMatcher = new faceapi.faceMatcher(labels, 0.6)
        const results = recizedDetections.map(d => 
            faceMatcher.findBestMatch(d.descriptior)
        )
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
        faceapi.draw.drawDetections(canvas, recizedDetections)
        faceapi.draw.drawFaceLandmarks(canvas, recizedDetections)
        faceapi.draw.drawFaceExpressions(canvas, recizedDetections)
        resizedDetections.forEach(detection => {
            const { age, gender, genderProbability } = detection
            new faceapi.draw.DrawTextField([
                `${parseInt(age, 10)} years`,
                `${gender} (${parseInt(genderProbability * 100, 10)})`
            ], detection.detection.box.topRight).draw(canvas)
        })
        results.forEach((result, index) => {
            const box = resizedDetections[index].detection.box
            const { label, distance } = result
            new faceapi.draw.DrawTextField([
                `${label}(${parseInt(distance * 100, 10)})`
            ], box.bottomRight).draw(canvas)
        })
    }, 100)
})