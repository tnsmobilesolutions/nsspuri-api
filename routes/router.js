const router = require("express").Router();

const devoteeController = require("../controllers/devoteeController")
const delegateController = require("../controllers/delegateController")
const paymentController = require("../controllers/paymentController")
const sanghaController = require("../controllers/sanghaController")


// Devotee Route
router.post("/devotee", devoteeController.devotee_create);
router.put("/devotee/:id", devoteeController.devotee_update);
router.get("/devotee", devoteeController.devotee_all);
router.get("/devotee/:id", devoteeController.devotee_details);
router.delete("/devotee/:id", devoteeController.devotee_delete);

// Delegate Route
router.post("/delegate", delegateController.delegate_create);
router.put("/delegate/:id", delegateController.delegate_update);
router.get("/delegate", delegateController.delegate_all);
router.get("/delegate/:id", delegateController.delegate_details);
router.delete("/delegate/:id", delegateController.delegate_delete);

// Payment Route
router.post("/payment", paymentController.payment_create);
router.put("/payment/:id", paymentController.payment_update);
router.get("/payment", paymentController.payment_all);
router.get("/payment/:id", paymentController.payment_details);
router.delete("/payment/:id", paymentController.payment_delete);

// Sangha Route
router.post("/sangha", sanghaController.sangha_create);
router.put("/sangha/:id", sanghaController.sangha_update);
router.get("/sangha", sanghaController.sangha_all);
router.get("/sangha/:id", sanghaController.sangha_details);
router.delete("/sangha/:id", sanghaController.sangha_delete);

module.exports = router;