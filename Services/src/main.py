# from fastapi import FastAPI, HTTPException
# from pydantic import BaseModel
# import boto3
# from boto3.dynamodb.conditions import Key

# app = FastAPI()

# # Initialize DynamoDB client
# dynamodb = boto3.resource('dynamodb')
# table = dynamodb.Table('LaundryUsers')

# class User(BaseModel):
#     id: str
#     name: str
#     email: str

# @app.get("/")
# async def root():
#     return {"message": "Welcome to the Laundry Service API"}

# @app.post("/users/")
# async def create_user(user: User):
#     try:
#         table.put_item(Item=user.dict())
#         return {"message": "User created successfully"}
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

# @app.get("/users/{user_id}")
# async def get_user(user_id: str):
#     try:
#         response = table.query(KeyConditionExpression=Key('id').eq(user_id))
#         if response['Items']:
#             return response['Items'][0]
#         raise HTTPException(status_code=404, detail="User not found")
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

# @app.get("/health")
# async def health_check():
#     return {"status": "healthy"}

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import boto3
from boto3.dynamodb.conditions import Key

app = FastAPI()

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('LaundryUsers')

class User(BaseModel):
    id: str
    name: str
    email: str

@app.get("/")
async def root():
    return {"message": "Welcome to the Laundry Service API"}

@app.post("/users/")
async def create_user(user: User):
    try:
        table.put_item(Item=user.dict())
        return {"message": "User created successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/users/{user_id}")
async def get_user(user_id: str):
    try:
        response = table.query(KeyConditionExpression=Key('id').eq(user_id))
        if response['Items']:
            return response['Items'][0]
        raise HTTPException(status_code=404, detail="User not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
