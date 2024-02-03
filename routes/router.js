const router = require("express").Router();

const devoteeController = require("../controllers/devoteeController")
const sammilani_delegateController = require("../controllers/sammilani_delegateController")
const transactionController = require("../controllers/transactionController")
const sanghaController = require("../controllers/sanghaController")
const addressController = require("../controllers/addressController")
const sammilaniController = require("../controllers/sammilaniController")
const jwt = require("jsonwebtoken")
const allController = require("../controllers/allController")


//Authentication Token
function autenticateToken(req,res,next) {
    const authHeader =  req.headers["authorization"];
    const token = authHeader?.split(' ')[1];
        if(token == null) return res.sendStatus(401);
        if(token == undefined) return res.sendStatus("bad requeat");
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err,user)=>{
    if (err) return res.sendStatus(403);
    req.user = user
    next()
        });
    }

//Get request 
function getRequest(str,func){
    return router.get(str,autenticateToken,func);
    }
    //post request 
    function postRequest(str,func){
    return router.post(str,autenticateToken,func);
    }
    //put request 
    function putRequest(str,func){
    return router.put(str,autenticateToken,func);
    }
    //delete request 
    function deleteRequest(str,func){
    return router.delete(str,func);
    }


// Devotee Route
router.post("/devotee", devoteeController.devotee_create);
postRequest("/devotee/relative", devoteeController.createRelativeDevotee);
putRequest("/devotee/:id", devoteeController.devotee_update);
getRequest("/devotee", devoteeController.devotee_all);
getRequest("/devotee/currentUser", devoteeController.devotee_details);
getRequest("/verifyDevotee/:devoteeCode", devoteeController.securityCheck);
getRequest("/devotee/relatives", devoteeController.devotee_with_relatives);
getRequest("/devoteeById/:id", devoteeController.devotee_details_by_devoteeId);
getRequest("/devoteeListBycreatedById/:id", devoteeController.devoteeListBycreatedById);
getRequest("/devotee/search", devoteeController.searchDevotee);
getRequest("/devotee/advance-search", devoteeController.advanceSearchDevotee);
router.get("/login/:uid", devoteeController.devoteeLogin);
deleteRequest("/devotee/:id", devoteeController.devotee_delete);
getRequest("/admin/dashboard", devoteeController.admin_devoteeDashboard);
getRequest("/prasadTakencount", devoteeController.prasadCount);
putRequest("/prasadUpdate/:code", devoteeController.prasdUpdateDevotee);
putRequest("/prasadTimingSetting/", devoteeController.updateSettings);
getRequest("/prasadTimingSetting/", devoteeController.getSettings);
getRequest("/prasadCountByselectdate/", devoteeController.prasadCountByselectdate);
getRequest("/prasdCountNow/", devoteeController.prasdCountNow);
// getRequest("/getPrasad/:code", devoteeController.prasdUpdatedevotee);


// Sammilani Delegate Route
postRequest("/sammilani-delegate", sammilani_delegateController.sammilani_delegate_create);
putRequest("/sammilani-delegate/:id", sammilani_delegateController.sammilani_delegate_update);
getRequest("/sammilani-delegate", sammilani_delegateController.sammilani_delegate_all);
getRequest("/sammilani-delegate/:id", sammilani_delegateController.sammilani_delegate_details);
deleteRequest("/sammilani-delegate/:id", sammilani_delegateController.sammilani_delegate_delete);

// Sammilani Route
postRequest("/sammilani", sammilaniController.sammilani_create);
putRequest("/sammilani/:id", sammilaniController.sammilani_update);
getRequest("/sammilani", sammilaniController.sammilani_all);
getRequest("/sammilani/:id", sammilaniController.sammilani_details);
deleteRequest("/sammilani/:id", sammilaniController.sammilani_delete);

// Transaction Route
postRequest("/transaction", transactionController.transaction_create);
putRequest("/transaction/:id", transactionController.transaction_update);
getRequest("/transaction", transactionController.transaction_all);
getRequest("/transaction/:id", transactionController.transaction_details);
deleteRequest("/transaction/:id", transactionController.transaction_delete);

// Sangha Route
postRequest("/sangha", sanghaController.sangha_create);
putRequest("/sangha/:id", sanghaController.sangha_update);
router.get("/sangha", sanghaController.sangha_all);
getRequest("/sangha/:id", sanghaController.sangha_details);
deleteRequest("/sangha/:id", sanghaController.sangha_delete);

// Address Route
postRequest("/address", addressController.address_create);
putRequest("/address/:id", addressController.address_update);
getRequest("/address", addressController.address_all);
getRequest("/address/:id", addressController.address_details);
deleteRequest("/address/:id", addressController.address_delete);

router.put("/updateFromDB",allController.dbController.updateDOB)

module.exports = router;