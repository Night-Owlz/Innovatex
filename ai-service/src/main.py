from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'message': 'AI service is ready for Part 2 implementation'
    })

@app.route('/api/analyze-receipt', methods=['POST'])
def analyze_receipt():
    return jsonify({
        'message': 'Receipt analysis endpoint - to be implemented in Part 2',
        'status': 'placeholder'
    })

@app.route('/api/predict-waste', methods=['POST'])
def predict_waste():
    return jsonify({
        'message': 'Waste prediction endpoint - to be implemented in Part 2',
        'status': 'placeholder'
    })

@app.route('/api/smart-recommendations', methods=['POST'])
def smart_recommendations():
    return jsonify({
        'message': 'AI-powered recommendations endpoint - to be implemented in Part 2',
        'status': 'placeholder'
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
