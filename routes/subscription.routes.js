import { Router } from "express";
import { createSubscription, getUserSubscriptions, getSubscriptionDetails, deleteSubscription, updateSubscription, getAllSubscriptions } from "../controllers/subscription.controller.js";
import authorize from "../middlewares/auth.middleware.js";


const subscriptionRouter = Router();


subscriptionRouter.get('/', authorize, getAllSubscriptions);

subscriptionRouter.get('/:id', getSubscriptionDetails);

subscriptionRouter.post('/', authorize, createSubscription);

subscriptionRouter.put('/:id', authorize, updateSubscription);

subscriptionRouter.delete('/:id', authorize, deleteSubscription);

subscriptionRouter.get('/user/:id', authorize, getUserSubscriptions);

subscriptionRouter.put('/cancel/:id', (req, res) => res.send({ body: { title: 'CANCEL Subscription' } }));

subscriptionRouter.get('/upcoming-renewals', (req, res) => res.send({ body: { title: 'GET upcoming renewals' } }));


export default subscriptionRouter;
