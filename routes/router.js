const router = require("express").Router();

const devoteeController = require("../controllers/devoteeController")
const sammilani_delegateController = require("../controllers/sammilani_delegateController")
const transactionController = require("../controllers/transactionController")
const sanghaController = require("../controllers/sanghaController")
const addressController = require("../controllers/addressController")
const sammilaniController = require("../controllers/sammilaniController")


// Devotee Route
router.post("/devotee", devoteeController.devotee_create);
router.put("/devotee/:id", devoteeController.devotee_update);
router.get("/devotee", devoteeController.devotee_all);
router.get("/devotee/:id", devoteeController.devotee_details);
router.get("/devotee/:uid", devoteeController.devotee_details_uid);
router.delete("/devotee/:id", devoteeController.devotee_delete);

// Sammilani Delegate Route
router.post("/sammilani-delegate", sammilani_delegateController.sammilani_delegate_create);
router.put("/sammilani-delegate/:id", sammilani_delegateController.sammilani_delegate_update);
router.get("/sammilani-delegate", sammilani_delegateController.sammilani_delegate_all);
router.get("/sammilani-delegate/:id", sammilani_delegateController.sammilani_delegate_details);
router.delete("/sammilani-delegate/:id", sammilani_delegateController.sammilani_delegate_delete);

// Sammilani Route
router.post("/sammilani", sammilaniController.sammilani_create);
router.put("/sammilani/:id", sammilaniController.sammilani_update);
router.get("/sammilani", sammilaniController.sammilani_all);
router.get("/sammilani/:id", sammilaniController.sammilani_details);
router.delete("/sammilani/:id", sammilaniController.sammilani_delete);

// Transaction Route
router.post("/transaction", transactionController.transaction_create);
router.put("/transaction/:id", transactionController.transaction_update);
router.get("/transaction", transactionController.transaction_all);
router.get("/transaction/:id", transactionController.transaction_details);
router.delete("/transaction/:id", transactionController.transaction_delete);

// Sangha Route
router.post("/sangha", sanghaController.sangha_create);
router.put("/sangha/:id", sanghaController.sangha_update);
router.get("/sangha", sanghaController.sangha_all);
router.get("/sangha/:id", sanghaController.sangha_details);
router.delete("/sangha/:id", sanghaController.sangha_delete);

// Address Route
router.post("/address", addressController.address_create);
router.put("/address/:id", addressController.address_update);
router.get("/address", addressController.address_all);
router.get("/address/:id", addressController.address_details);
router.delete("/address/:id", addressController.address_delete);

module.exports = router;