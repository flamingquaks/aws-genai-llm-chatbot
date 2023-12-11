import json
import uuid
import decimal
from pydantic import BaseModel


class CustomEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, decimal.Decimal):
            if obj % 1 > 0:
                return float(obj)
            else:
                return int(obj)

        if isinstance(obj, uuid.UUID):
            return str(obj)

        if isinstance(obj, BaseModel):
            try:
                return obj.model_dump_json()
            except Exception as e:
                print(e)
                return obj.json()

        return super(CustomEncoder, self).default(obj)
