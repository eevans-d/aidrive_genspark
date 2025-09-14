import os

def validate_env_vars(required_vars):
    missing = [var for var in required_vars if not os.getenv(var)]
    if missing:
        raise RuntimeError(f"Variables de entorno faltantes: {', '.join(missing)}. Verifica tu .env antes de iniciar el servicio.")

# Ejemplo de uso en main de cada servicio:
# validate_env_vars(["JWT_SECRET_KEY", "DB_HOST", "DB_USER", "DB_PASSWORD"])
