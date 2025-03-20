# wind_web

## deploy to surge.sh
surge .\website winding.surge.sh

## stripe test
stripe/stripe listen --forward-to https://z2qmzcusx7.execute-api.eu-central-1.amazonaws.com/prod/payment

stripe/stripe login

stripe/stripe trigger checkout.session.completed