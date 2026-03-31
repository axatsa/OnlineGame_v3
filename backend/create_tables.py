import os
from dotenv import load_dotenv
load_dotenv()

from database import engine, Base
import apps.auth.models
import apps.library.models
import apps.classes.models
import apps.generator.models
import apps.gamification.models
import apps.admin.models

Base.metadata.create_all(bind=engine)
print("Tables created successfully.")
