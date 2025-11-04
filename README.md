# WinderCAM Frontend

**WinderCAM** is a web-based platform for generating CNC winding programs for composite manufacturing.
The frontend provides an interface to define mandrel geometry, winding patterns, and machine parameters — all integrated with AWS services for calculation function calls, authentication and subscription management.

## Tech Stack
- **Axios**: API integration with AWS API Gateway + AWS Lambda
- **Authentication**: AWS Cognito - user registration, login, and secure session handling
- **Stripe** integration: subscription payments and plan management
- **AWS S3**: hosting (optionally Surge for staging)
- **Frontend DB management**: Dexie
- **3D Graphics**: Three
- **2D Graphics**: Charts
- **File format**: Yaml

## test deploy to surge.sh
surge .\website winding.surge.sh

## stripe test
stripe/stripe listen --forward-to https://z2qmzcusx7.execute-api.eu-central-1.amazonaws.com/prod/payment
stripe/stripe login
stripe/stripe trigger checkout.session.completed

## License
**WinderCAM Source-Available License © 2025 WinderCAM**
All rights reserved © 2025 by WinderCAM
This code is publicly available for reference and educational purposes only.  
Commercial or production use is not permitted without explicit written permission.  

## Links & Contact
- **Website**: https://windercam.com
- **Contact**: kontakt@windercam.de
- **LinkedIn**: https://www.linkedin.com/company/WinderCAM/
