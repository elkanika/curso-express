require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');

const LoggerMiddleware = require('./middlewares/logger');
const errorHandler = require('./middlewares/errorHandler');
const {validateUser} = require('./utils/validation'); 
const authenticateToken = require('./middlewares/auth')

const fs = require("fs");
const path = require("path");
const usersFilePath = path.join(__dirname, 'users.json');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(LoggerMiddleware);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

//GETs
app.get('/', (req, res) => {
    res.send(`
        <h1>Curso Express.JS</h1>
        <p>Esto es una aplicacion node.js con express.js</p>
        <p>Corre en el puerto: ${PORT}</p>
        `);
});

app.get('/users/:id', (req, res) => {
    const userId = req.params.id;
    res.send(`Mostrar informacion del usuario con ID: ${userId}`)
});

app.get('/search', (req, res) => {
    const terms = req.query.termino || 'No especificado';
    const category = req.query.categoria || 'Todas';

    res.send(`
        <h2>Resultados de busqueda:</h2>
        <p>Termino: ${terms}</p>
        <p>Categoria: ${category}</p>
        `)
});

app.get('/users', (req, res) => {
    fs.readFile(usersFilePath, 'utf-8', (err, data) => {
        if (err) {
            return res.status(500).json({error: "Error con conexion de datos."})
        }
        const users = JSON.parse(data);
        res.json(users);
    })
});

app.get('/protected-route', authenticateToken, (req, res) => {
    res.send('Esta es una ruta protegida.');
});

//POSTs
app.post('/form',(req, res) => {
    const name = req.body.nombre || 'Anonimo';
    const email = req.body.email || 'No proporcionado';
    res.json({
        message: 'Datos recibidos',
        data: {
            name,
            email
        }
    });
});

app.post('/api/data', (req, res) => {
    const data = req.body;

    if(!data || Object.keys(data).length === 0) {
        return res.status(400).json({error: 'No se recibieron datos'});
    }

    res.status(200).json({
        message: 'Datos JSON recibidos',
        data
    });
});

app.post('/users', (req, res) => {
    const newUser = req.body;
    fs.readFile(usersFilePath, 'utf-8', (err, data) => {
        if (err){
            return res.status(500).json({error: "Error con conexion de datos"})
        }

        const users = JSON.parse(data);
        
        const validation = validateUser(newUser, users);
        if (!validation.isValid){
            return res.status(400).json({error: validation.error});
        }
        
        users.push(newUser);
        fs.writeFile(usersFilePath, JSON.stringify(users, null, 2), (err) => {
            if (err){
                return res.status(500).json({error: "Error al guardar el usuario"});
            }

            res.status(201).json(newUser);
        });
    });
});


app.post('/register', async (req, res) => {
    const {email, password, name} = req.body;
    const hansedPassword = await bcrypt.hash(password, 10);
    //const newUser = await
});
//PUTs
app.put('/users/:id', (req, res) => {
    const userId = parseInt(req.params.id, 10)
    const updateUser = req.body;

    fs.readFile(usersFilePath, 'utf8', (err, data) => {
        if(err){
            return res.status(500).json({error: 'Error por conexion de datos.'})
            
        }

        let users = JSON.parse(data);

        const validation = validateUser(updateUser, users, true);
        if(!validation.isValid){
            return res.status(400).json({error: validation.error});
        }
        
        users = users.map(user => (user.id === userId ? {...user, ...updateUser} : user
        ));
        fs.writeFile(usersFilePath, JSON.stringify(users, null, 2), (err) => {
            if (err){
                return res.status(500).json({error: 'Error al actualizar el usuario'});

            }
            res.json(updateUser);
        })
    });
});

//DELETEs
app.delete('/users/:id', (req, res) => {
    const userId = parseInt(req.params.id, 10);
    fs.readFile(usersFilePath, 'utf8', (err, data) =>{
        if(err){
            return res.status(500).json({error: 'Error con conexion de datos'});
        }
        let users = JSON.parse(data);
        users = users.filter(user => user.id !== userId)
        fs.writeFile(usersFilePath, JSON.stringify(users, null, 2), (err) =>{
            if (err){
                return res.status(500).json({error: 'Error al eliminar usuario'});
            }
            res.status(204).send();
        });
    });
})

//Ejemplo de ErrorHandler (no tiene que ir a produccion)
/*app.get('/error', (req, res, next) => {
    next(new Error('Error Intencional'));
});
*/

//LISTEN
app.listen(PORT, () =>{
    console.log(`Servidor: http://localhost:${PORT}`);
});
