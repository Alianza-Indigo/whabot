import { Link } from 'react-router-dom';

export function LandingPage() {
  return (
    <div className="landing-page">
      <nav className="landing-nav">
        <div className="landing-wrap landing-nav-in">
          <a className="landing-logo" href="/">
            wha<span>bo</span>
          </a>
          <div className="landing-nav-links">
            <a href="#producto">Producto</a>
            <a href="#seguridad">Seguridad</a>
            <a href="#contacto">Contacto</a>
            <Link className="landing-btn landing-btn-secondary" to="/console/login">
              Ingresar
            </Link>
            <a className="landing-btn" href="mailto:contacto@amecrec.org?subject=Quiero%20probar%20Whabo">
              Solicitar acceso
            </a>
          </div>
        </div>
      </nav>

      <header className="landing-hero landing-wrap">
        <div>
          <span className="landing-eyebrow">Plataforma de agentes conversacionales</span>
          <h1>
            Tu negocio responde en WhatsApp. <em>Solo.</em>
          </h1>
          <p className="landing-lead">
            Whabo te permite crear agentes de inteligencia artificial que atienden a tus clientes por WhatsApp: con tu
            conocimiento, tu tono y tus propias credenciales. Tu tienes el control; nosotros la infraestructura.
          </p>
          <div className="landing-hero-cta">
            <Link className="landing-btn" to="/console/login">
              Ingresar a la consola
            </Link>
            <a className="landing-btn-ghost" href="#como-funciona">
              Como funciona
            </a>
          </div>
        </div>

        <div className="landing-phone" aria-label="Ejemplo de conversacion con un agente Whabo">
          <div className="landing-phone-head">
            <div className="landing-avatar">F</div>
            <div>
              <b>Floreria Marisol</b>
              <small>Agente Whabo · en linea</small>
            </div>
          </div>
          <div className="landing-msgs">
            <div className="landing-msg landing-msg-in">Hola, tienen arreglos para entregar hoy en Coyoacan?</div>
            <div className="landing-msg landing-msg-out">
              Hola. Si, hoy tenemos entrega mismo dia en Coyoacan hasta las 6 pm. Buscas algo para una ocasion especial?
            </div>
            <div className="landing-msg landing-msg-in">Es un cumpleanos, presupuesto como de $600</div>
            <div className="landing-msg landing-msg-out">
              Perfecto. Te recomiendo el ramo Primavera ($550) o la caja de tulipanes ($590). Te comparto fotos de ambos?
            </div>
          </div>
          <div className="landing-phone-foot">
            <span className="landing-dot" /> Responde con el catalogo y horarios del negocio
          </div>
        </div>
      </header>

      <section id="producto" className="landing-section">
        <div className="landing-wrap">
          <h2>Cada negocio, sus propios agentes</h2>
          <p className="landing-sub">Whabo es multi-empresa por diseno: tu cuenta, tus bots, tus datos. Nada se comparte entre clientes.</p>
          <div className="landing-grid">
            <article className="landing-cell">
              <h3>Tu conocimiento</h3>
              <p>Carga tu catalogo, horarios, politicas y preguntas frecuentes. El agente responde con tu informacion, no con la de internet.</p>
            </article>
            <article className="landing-cell">
              <h3>Tus credenciales</h3>
              <p>Conectas tu propia llave de OpenAI, Anthropic, Google o Mistral. Tu decides que modelo usa tu agente y controlas tu consumo.</p>
            </article>
            <article className="landing-cell">
              <h3>Tu numero</h3>
              <p>Tu agente opera sobre tu numero de WhatsApp Business. El numero, la relacion con tus clientes y el historial son tuyos.</p>
            </article>
            <article className="landing-cell">
              <h3>Tu equipo</h3>
              <p>Invita colaboradores con permisos por rol: quien edita el agente, quien administra credenciales y quien solo consulta.</p>
            </article>
            <article className="landing-cell">
              <h3>Tu marca</h3>
              <p>Personaliza nombre, tono, mensaje de bienvenida y comandos. El agente habla como tu negocio, en tu idioma.</p>
            </article>
            <article className="landing-cell">
              <h3>Tu tablero</h3>
              <p>Consola con metricas, conversaciones, retroalimentacion de clientes y auditoria de cada cambio en tu cuenta.</p>
            </article>
          </div>
        </div>
      </section>

      <section id="seguridad" className="landing-section">
        <div className="landing-wrap">
          <div className="landing-band">
            <div>
              <h2>Seguridad que no es promesa: es arquitectura</h2>
              <p className="landing-sub">
                Cada practica descrita aqui esta implementada en nuestra plataforma y descrita en nuestra{' '}
                <a href="/privacidad.html">politica de privacidad</a>.
              </p>
            </div>
            <div className="landing-sec-list">
              <SecurityItem title="Cifrado AES-256-GCM">
                Credenciales y contenido de mensajes se almacenan cifrados, con rotacion de llaves.
              </SecurityItem>
              <SecurityItem title="Numeros protegidos">
                Los telefonos de tus clientes se almacenan como hashes con sal secreta, no en texto plano.
              </SecurityItem>
              <SecurityItem title="Derechos ARCO">
                Acceso, rectificacion y supresion de datos personales, con registro de auditoria de cada operacion.
              </SecurityItem>
              <SecurityItem title="Retencion configurable">
                Tu defines cuantos dias se conservan las conversaciones de tu negocio.
              </SecurityItem>
              <SecurityItem title="Protocolos de crisis">
                Deteccion de situaciones sensibles con lineas de atencion configurables por pais.
              </SecurityItem>
            </div>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="landing-section">
        <div className="landing-wrap">
          <h2>De cero a tu primer agente</h2>
          <p className="landing-sub">Sin instalar nada. Todo desde la consola de Whabo.</p>
          <div className="landing-steps">
            <Step title="Crea tu cuenta">Registra tu negocio y obten tu espacio aislado en la plataforma, con tu equipo y tus permisos.</Step>
            <Step title="Configura tu agente">Define su personalidad, carga tu conocimiento y conecta la llave del modelo de IA que prefieras.</Step>
            <Step title="Conecta tu WhatsApp">
              Vincula tu numero de WhatsApp Business y tu agente empieza a atender. Tu supervisas todo desde la consola.
            </Step>
          </div>
        </div>
      </section>

      <section id="contacto" className="landing-section">
        <div className="landing-wrap landing-contact">
          <div>
            <h2>Hablemos</h2>
            <p className="landing-sub">Whabo esta en acceso temprano. Escribenos y te contactamos para configurar tu cuenta.</p>
            <a className="landing-btn" href="mailto:contacto@amecrec.org?subject=Quiero%20probar%20Whabo">
              Escribir a contacto@amecrec.org
            </a>
          </div>
          <dl className="landing-contact-card">
            <dt>Producto</dt>
            <dd>Whabo - Plataforma de agentes conversacionales de WhatsApp</dd>
            <dt>Correo de contacto</dt>
            <dd>
              <a href="mailto:contacto@amecrec.org">contacto@amecrec.org</a>
            </dd>
            <dt>Responsable</dt>
            <dd>Asociacion Mexicana de Criptomineria Ecológica AC</dd>
            <dt>Ubicacion</dt>
            <dd>Chihuahua, Mexico</dd>
          </dl>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-wrap landing-foot-in">
          <span>&copy; 2026 Whabo &middot; whabo.xyz</span>
          <span>
            <a href="/terminos.html">Terminos y condiciones</a>
            <a href="/privacidad.html">Politica de privacidad</a>
          </span>
        </div>
      </footer>
    </div>
  );
}

function SecurityItem({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="landing-sec-item">
      <span className="landing-mark">-&gt;</span>
      <div>
        <b>{title}</b>
        <span>{children}</span>
      </div>
    </div>
  );
}

function Step({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article className="landing-step">
      <h3>{title}</h3>
      <p>{children}</p>
    </article>
  );
}
