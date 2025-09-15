<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">

<head>
 <title>Checkout</title>
</head>

<body>
  <form id="payment-form">
    <div id="payment-element">
      <!-- Elements will create form elements here -->
    </div>
    <button id="submit">Submit</button>
    <div id="error-message">
      <!-- Display error message to your customers here -->
    </div>
  </form>



  <script src="https://js.stripe.com/v3/"></script>
  <script>
    const style = {
      base: {
        iconColor: '#c4f0ff',
        color: '#fff',
        fontWeight: '500',
        fontFamily: 'Roboto, Open Sans, Segoe UI, sans-serif',
        fontSize: '16px',
        fontSmoothing: 'antialiased',
        ':-webkit-autofill': {
          color: '#fce883',
        },
        '::placeholder': {
          color: '#87BBFD',
        },
      },
      invalid: {
        iconColor: '#FFC7EE',
        color: '#FFC7EE',
      },
    } 
    const stripe = Stripe('{{publicKey}}');
    const options = {
      clientSecret: '{{clientSecret}}',
        appearance: {theme: 'stripe'},
    };
    const elements = stripe.elements(options);

    // Create and mount the Payment Element
    const paymentElement = elements.create('payment');
    paymentElement.mount('#payment-element');

    const form = document.getElementById('payment-form');

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const {error} = await stripe.confirmSetup({
        //`Elements` instance that was used to create the Payment Element
        elements,
        confirmParams: {
          return_url: '{{returnUrl}}',
        }
      });

      if (error) {
        // This point will only be reached if there is an immediate error when
        // confirming the payment. Show error to your customer (for example, payment
        // details incomplete)
        const messageContainer = document.querySelector('#error-message');
        messageContainer.textContent = error.message;
      } else {
        // Your customer will be redirected to your `return_url`. For some payment
        // methods like iDEAL, your customer will be redirected to an intermediate
        // site first to authorize the payment, then redirected to the `return_url`.
        console.log("success")
      }
    });
  </script>
</body>

</html>
