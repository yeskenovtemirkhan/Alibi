from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    """Serializes as camelCase so responses match the frontend's TypeScript types (src/types/index.ts)."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)
