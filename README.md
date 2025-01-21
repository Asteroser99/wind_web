# wind_web

## deploy to surge.sh
surge .\website winding.surge.sh

## stripe test
./stripe listen --forward-to https://z2qmzcusx7.execute-api.eu-central-1.amazonaws.com/prod/stripe
./stripe trigger checkout.session.completed