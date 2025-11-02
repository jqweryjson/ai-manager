#!/usr/bin/env python3
"""
Простой HTTP сервер для генерации эмбеддингов с использованием модели bge-m3.
Запускается в Docker контейнере и слушает на порту 5000.
"""

from flask import Flask, request, jsonify
import os
import logging
from sentence_transformers import SentenceTransformer
import numpy as np

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Загрузка модели при старте сервера
MODEL_NAME = os.getenv('MODEL_NAME', 'BAAI/bge-m3')
logger.info(f"Загружаю модель: {MODEL_NAME}")

try:
    model = SentenceTransformer(MODEL_NAME)
    logger.info("Модель загружена успешно")
except Exception as e:
    logger.error(f"Ошибка загрузки модели: {e}")
    raise

@app.route('/health', methods=['GET'])
def health():
    """Проверка статуса сервера"""
    return jsonify({'status': 'ok', 'model': MODEL_NAME})

@app.route('/embed', methods=['POST'])
def embed_single():
    """Генерация эмбеддинга для одного текста"""
    try:
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({'error': 'Поле "text" обязательно'}), 400

        text = data['text']
        logger.info(f"Генерация эмбеддинга для текста длиной {len(text)} символов")

        # Генерация эмбеддинга
        vector = model.encode(text)

        # Конвертация в список для JSON сериализации
        vector_list = vector.tolist() if hasattr(vector, 'tolist') else vector

        return jsonify({
            'vector': vector_list,
            'dimension': len(vector_list),
            'model': MODEL_NAME
        })

    except Exception as e:
        logger.error(f"Ошибка генерации эмбеддинга: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/embed/batch', methods=['POST'])
def embed_batch():
    """Генерация эмбеддингов для батча текстов"""
    try:
        data = request.get_json()
        if not data or 'texts' not in data:
            return jsonify({'error': 'Поле "texts" обязательно'}), 400

        texts = data['texts']
        if not isinstance(texts, list):
            return jsonify({'error': '"texts" должен быть массивом'}), 400

        logger.info(f"Генерация эмбеддингов для батча из {len(texts)} текстов")

        # Генерация эмбеддингов батчем
        vectors = model.encode(texts)

        # Конвертация в списки
        vectors_list = vectors.tolist() if hasattr(vectors, 'tolist') else vectors

        return jsonify({
            'vectors': vectors_list,
            'count': len(vectors_list),
            'dimension': len(vectors_list[0]) if vectors_list else 0,
            'model': MODEL_NAME
        })

    except Exception as e:
        logger.error(f"Ошибка генерации батча эмбеддингов: {e}")
        return jsonify({'error': str(e)}), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Эндпоинт не найден'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Внутренняя ошибка сервера'}), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    logger.info(f"Запуск сервера на порту {port}")
    app.run(host='0.0.0.0', port=port, debug=False)
