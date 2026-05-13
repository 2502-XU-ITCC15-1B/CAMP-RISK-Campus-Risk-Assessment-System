from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent


def _load_env_file(path: Path) -> None:
    """Load KEY=VALUE lines into os.environ if not already set (same idea as python-dotenv)."""
    if not path.is_file():
        return
    try:
        raw = path.read_text(encoding='utf-8-sig')
    except OSError:
        return
    for line in raw.splitlines():
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        if line.startswith('export '):
            line = line[7:].strip()
        if '=' not in line:
            continue
        key, _, val = line.partition('=')
        key = key.strip()
        if not key or key.startswith('#'):
            continue
        val = val.strip().strip('"').strip("'")
        if key not in os.environ:
            os.environ[key] = val


# Local secrets / overrides (not committed). Works even if python-dotenv is not installed.
_load_env_file(BASE_DIR / '.env')
_load_env_file(BASE_DIR / 'local.env')
_load_env_file(BASE_DIR.parent / '.env')

try:
    from dotenv import load_dotenv

    load_dotenv(BASE_DIR / '.env')
    load_dotenv(BASE_DIR / 'local.env')
    load_dotenv(BASE_DIR.parent / '.env')
except ImportError:
    pass

SECRET_KEY = os.environ.get('SECRET_KEY', 'change-me-in-production')


# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.environ.get('DEBUG', '').lower() in ('1', 'true', 'yes')

_allowed_hosts = os.environ.get('ALLOWED_HOSTS', 'localhost,127.0.0.1,.onrender.com')
ALLOWED_HOSTS = [h.strip() for h in _allowed_hosts.split(',') if h.strip()]


INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'corsheaders',
    'accounts',
    'reports',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'accounts.bearer_auth.BearerAuthMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'camp_risk.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'camp_risk.wsgi.application'


# Order: DATABASE_URL (Render Postgres) → MySQL (Docker) → SQLite (local).
if os.environ.get('DATABASE_URL'):
    import dj_database_url

    DATABASES = {
        'default': dj_database_url.config(
            conn_max_age=600,
            ssl_require=True,
        )
    }
elif os.environ.get('DB_HOST'):
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.mysql',
            'NAME': os.environ.get('DB_NAME', 'camp_risk_db'),
            'USER': os.environ.get('DB_USER', 'camp_risk_user'),
            'PASSWORD': os.environ.get('DB_PASSWORD', 'camp_risk_pass'),
            'HOST': os.environ.get('DB_HOST'),
            'PORT': os.environ.get('DB_PORT', '3306'),
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

CORS_ALLOWED_ORIGINS = [
    'http://127.0.0.1:5173',
    'http://localhost:5173',
    'http://127.0.0.1:4173',
    'http://localhost:4173',
]
_extra_cors = os.environ.get('CORS_ALLOWED_ORIGINS', '')
if _extra_cors:
    CORS_ALLOWED_ORIGINS.extend(
        [o.strip() for o in _extra_cors.split(',') if o.strip()]
    )
CORS_ALLOW_CREDENTIALS = True


AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STORAGES = {
    'default': {
        'BACKEND': 'django.core.files.storage.FileSystemStorage',
    },
    'staticfiles': {
        'BACKEND': 'whitenoise.storage.CompressedStaticFilesStorage',
    },
}

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Session: local dev uses Vite proxy (same-site). Production often splits static site + API
# on different *.onrender.com hosts — browsers require SameSite=None + Secure for cookies on
# cross-origin credentialed fetch().
_session_samesite = os.environ.get('SESSION_COOKIE_SAMESITE', '').strip().lower()
if _session_samesite in ('lax', 'strict', 'none'):
    SESSION_COOKIE_SAMESITE = _session_samesite.capitalize()
elif DEBUG:
    SESSION_COOKIE_SAMESITE = 'Lax'
else:
    SESSION_COOKIE_SAMESITE = 'None'
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG

CSRF_TRUSTED_ORIGINS = [
    'http://127.0.0.1:5173',
    'http://localhost:5173',
    'http://127.0.0.1:4173',
    'http://localhost:4173',
]
_extra_csrf = os.environ.get('CSRF_TRUSTED_ORIGINS', '')
if _extra_csrf:
    CSRF_TRUSTED_ORIGINS.extend(
        [o.strip() for o in _extra_csrf.split(',') if o.strip()]
    )

SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')