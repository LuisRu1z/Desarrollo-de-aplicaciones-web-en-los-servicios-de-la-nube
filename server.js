const express = require('express');
const { Pool } = require('pg');
const app = express();
const PORT = process.env.PORT || 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

pool.query(`
  CREATE TABLE IF NOT EXISTS alumnos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    codigo VARCHAR(20) NOT NULL
  );
`).catch(err => console.error("Error base datos:", err));

app.get('/api/alumnos', async (req, res) => {
  const result = await pool.query('SELECT * FROM alumnos ORDER BY id');
  res.json(result.rows);
});

app.get('/api/alumnos/:id', async (req, res) => {
  const result = await pool.query('SELECT * FROM alumnos WHERE id = $1', [req.params.id]);
  res.json(result.rows[0]);
});

app.post('/api/alumnos', async (req, res) => {
  const { nombre, codigo } = req.body;
  await pool.query('INSERT INTO alumnos (nombre, codigo) VALUES ($1, $2)', [nombre, codigo]);
  res.redirect('/');
});

app.post('/api/alumnos/editar/:id', async (req, res) => {
  const { nombre, codigo } = req.body;
  await pool.query('UPDATE alumnos SET nombre = $1, codigo = $2 WHERE id = $3', [nombre, codigo, req.params.id]);
  res.redirect('/');
});

app.get('/api/alumnos/eliminar/:id', async (req, res) => {
  await pool.query('DELETE FROM alumnos WHERE id = $1', [req.params.id]);
  res.redirect('/');
});

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <title>Actividad Unidad 3 - Base de Datos - Luis Ruiz</title>
        <style>
            body {
                margin: 0; padding: 0;
                background-image: url('https://images.unsplash.com/photo-1544197150-b99a580bb7a8?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80');
                background-size: cover; background-attachment: fixed;
                font-family: Arial, sans-serif; color: #333;
            }
            .main-container {
                width: 90%; max-width: 1000px; margin: 50px auto;
                background: rgba(255, 255, 255, 0.95); border-radius: 15px;
                overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            }
            header { padding: 20px; background: #f8f9fa; border-bottom: 2px solid #ddd; overflow: hidden; }
            .logo { float: left; width: 80px; height: auto; }
            .content { padding: 40px; text-align: center; }
            .video-link { display: inline-block; margin: 20px 0; padding: 15px 30px; background-color: #ff0000; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; }
            .crud-section { display: flex; flex-wrap: wrap; gap: 20px; justify-content: center; margin-top: 30px; text-align: left; }
            .box { background: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); width: 100%; max-width: 450px; box-sizing: border-box; }
            input, button { padding: 10px; margin: 8px 0; width: 100%; box-sizing: border-box; border-radius: 4px; border: 1px solid #ccc; }
            button { background: #007bff; color: white; border: none; cursor: pointer; font-weight: bold; }
            .alumno-item { display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #eee; }
            .btn-del { background: #dc3545; width: auto; padding: 5px 10px; font-size: 12px; }
            .btn-edit { background: #ffc107; color: #333; width: auto; padding: 5px 10px; font-size: 12px; margin-right: 5px; }
            footer { padding: 20px; background: #333; color: white; text-align: center; font-size: 14px; margin-top: 40px; }
        </style>
    </head>
    <body>
        <div class="main-container">
            <header>
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Python-logo-notext.svg/1869px-Python-logo-notext.svg.png" alt="Logo" class="logo">
            </header>
            <div class="content">
                <h1>Aplicación Web Dinámica con Base de Datos</h1>
                <p>Esta aplicación está conectada a una base de datos PostgreSQL en la nube (Render) y permite gestionar registros en tiempo real.</p>
                <a href="https://www.youtube.com/watch?v=3K_ZfQp0vHw" target="_blank" class="video-link">Ver Video en YouTube</a>
                <hr style="border: 0; height: 1px; background: #ddd; margin: 20px 0;">
                <div class="crud-section">
                    <div class="box">
                        <h3>Agregar Registro (Create)</h3>
                        <form action="/api/alumnos" method="POST">
                            <input type="text" name="nombre" placeholder="Nombre" required>
                            <input type="text" name="codigo" placeholder="Código" required>
                            <button type="submit">Guardar en Base de Datos</button>
                        </form>
                    </div>
                    <div class="box">
                        <h3>Registros Guardados (Read, Update, Delete)</h3>
                        <div id="lista">Cargando base de datos...</div>
                    </div>
                    <div class="box" id="edit-box" style="display:none; max-width: 920px;">
                        <h3>Modificar Registro</h3>
                        <form id="edit-form" method="POST">
                            <input type="text" name="nombre" id="edit-nombre" required>
                            <input type="text" name="codigo" id="edit-codigo" required>
                            <button type="submit" style="background: #28a745;">Confirmar Cambios</button>
                        </form>
                    </div>
                </div>
            </div>
            <footer>
                <p><strong>Curso:</strong> Conceptualización de servicios en la nube</p>
                <p><strong>Nombre:</strong> Luis Ruiz</p>
                <p><strong>Código:</strong> 207637993</p>
                <p><strong>Contacto:</strong> alberto.ruiz@udgvirtual.udg.mx</p>
            </footer>
        </div>
        <script>
            fetch('/api/alumnos')
                .then(res => res.json())
                .then(data => {
                    const lista = document.getElementById('lista');
                    if(data.length === 0) { lista.innerHTML = "<p>Base de datos vacía.</p>"; return; }
                    lista.innerHTML = data.map(a => \`
                        <div class="alumno-item">
                            <span><strong>\${a.nombre}</strong> (\${a.codigo})</span>
                            <div>
                                <button class="btn-edit" onclick="cargarEditar(\${a.id})">Editar</button>
                                <button class="btn-del" onclick="location.href='/api/alumnos/eliminar/\${a.id}'">X</button>
                            </div>
                        </div>
                    \`).join('');
                });
            function cargarEditar(id) {
                fetch('/api/alumnos/' + id)
                    .then(res => res.json())
                    .then(a => {
                        document.getElementById('edit-box').style.display = 'block';
                        document.getElementById('edit-nombre').value = a.nombre;
                        document.getElementById('edit-codigo').value = a.codigo;
                        document.getElementById('edit-form').action = '/api/alumnos/editar/' + id;
                    });
            }
        </script>
    </body>
    </html>
  `);
});

app.listen(PORT, () => console.log(`Servidor corriendo`));
