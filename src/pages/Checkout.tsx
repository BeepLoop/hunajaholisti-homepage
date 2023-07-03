import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import Spinner from "../Spinner";
import { CartContext } from "src/CartContext";

const Checkout = () => {
    const stripe = useStripe();
    const elements = useElements();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const { state, dispatch } = useContext(CartContext);
    const totalAmount = state.total;

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setLoading(true);

        if (!stripe || !elements) {
            setLoading(false);
            return;
        }

        //* Fetch the secret from the Netlify function
        const response = await fetch(
            "/.netlify/functions/create-payment-intent",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ amount: totalAmount }),
            }
        );
        const data = await response.json();
        const clientSecret = data.clientSecret;

        const cardElement = elements.getElement(CardElement);

        if (cardElement) {
            const result = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: cardElement,
                },
            });

            if (result.error) {
                alert(result.error.message);
            } else {
                if (result.paymentIntent.status === "succeeded") {
                    console.log("Payment succeeded!");
                    dispatch({ type: "CLEAR" });
                    navigate("/success");
                }
            }
        }

        setLoading(false);
    };

    return (
        <>
            <div className="py-20"></div>
            <div className="container mx-auto p-6 bg-white shadow-md rounded-lg">
                <h2 className="text-2xl font-bold mb-4 text-gray-700">
                    Kassa
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="p-4 border border-gray-300 rounded-md">
                        <CardElement className="p-2" />
                    </div>
                    <h2 className="font-bold mb-4 text-gray-700">
                        Yhteensä: {totalAmount} €
                    </h2>
                    <button
                        type="submit"
                        disabled={!stripe || loading}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-300 w-full md:w-auto"
                    >
                        {loading ? <Spinner /> : "Proceed to Pay"}
                    </button>
                </form>
            </div>
        </>
    );
};

export default Checkout;