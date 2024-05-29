const express = require("express");
const router = express.Router();
const passport = require("passport");
const UserController = require("../controllers/user.controller.js");

const userController = new UserController();

router.post("/register", userController.register);
router.post("/login", userController.login);
router.get("/profile", passport.authenticate("jwt", { session: false }), userController.profile);
router.post("/logout", userController.logout.bind(userController));
router.get("/admin", passport.authenticate("jwt", { session: false }), userController.admin);

//Tercer integradora: 
router.post("/requestPasswordReset", userController.requestPasswordReset); // Nueva ruta
router.post('/reset-password', userController.resetPassword);
router.put("/premium/:uid", userController.cambiarRolPremium);

//Cuarta integradora: 

const multer = require("multer");
const UserModel = require("../models/user.model.js");
const path = require("path");

// Configuración de Multer para guardar archivos en diferentes carpetas
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const userId = req.params.uid;
        const fileType = req.query.type; // Tipo de archivo enviado en la consulta (?type=profile, ?type=product, etc.)

        let uploadPath = ''; // Carpeta de destino para la carga de archivos

        if (fileType === 'profile') {
            uploadPath = path.join(__dirname, `../uploads/profiles/${userId}`);
        } else if (fileType === 'product') {
            uploadPath = path.join(__dirname, `../uploads/products/${userId}`);
        } else {
            uploadPath = path.join(__dirname, `../uploads/documents/${userId}`);
        }

        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage });

// Endpoint para subir documentos
router.post("/:uid/documents", upload.array('documents'), async (req, res) => {
    const userId = req.params.uid;
    const uploadedDocuments = req.files;

    try {
        const user = await UserModel.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Procesar los documentos subidos y actualizar el usuario
        user.documents = uploadedDocuments.map(doc => ({
            name: doc.originalname,
            reference: doc.path // Podrías guardar la URL o la ruta del archivo según tu configuración
        }));

        await user.save();

        res.status(200).json({ message: 'Documentos subidos exitosamente', user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});


module.exports = router;

