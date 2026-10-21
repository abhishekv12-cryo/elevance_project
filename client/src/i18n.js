export const LANGUAGES = { en: 'English', es: 'Español', hi: 'हिन्दी', pt: 'Português', zh: '中文', fr: 'Français' };
const KEYS = ['app_title', 'home', 'public_space', 'plans', 'profile', 'login', 'logout', 'register', 'language',
  'ask_question', 'questions', 'answers', 'points', 'search_users', 'submit', 'username', 'password',
  'email', 'phone', 'login_history', 'transfer_points', 'post', 'comments', 'subscribe'];
const ROWS = {
  en: ['Q&A Platform','Home','Public space','Plans','Profile','Log in','Log out','Register','Language','Ask a question','Questions','Answers','Points','Search users','Submit','Username','Password','Email','Phone','Login history','Transfer points','Post','Comments','Subscribe'],
  es: ['Plataforma de P&R','Inicio','Espacio público','Planes','Perfil','Iniciar sesión','Cerrar sesión','Registrarse','Idioma','Hacer una pregunta','Preguntas','Respuestas','Puntos','Buscar usuarios','Enviar','Usuario','Contraseña','Correo','Teléfono','Historial de inicios de sesión','Transferir puntos','Publicar','Comentarios','Suscribirse'],
  hi: ['प्रश्नोत्तर मंच','होम','सार्वजनिक स्थान','योजनाएँ','प्रोफ़ाइल','लॉग इन','लॉग आउट','रजिस्टर','भाषा','प्रश्न पूछें','प्रश्न','उत्तर','अंक','उपयोगकर्ता खोजें','जमा करें','उपयोगकर्ता नाम','पासवर्ड','ईमेल','फ़ोन','लॉगिन इतिहास','अंक स्थानांतरित करें','पोस्ट करें','टिप्पणियाँ','सदस्यता लें'],
  pt: ['Plataforma de P&R','Início','Espaço público','Planos','Perfil','Entrar','Sair','Registrar','Idioma','Fazer uma pergunta','Perguntas','Respostas','Pontos','Buscar usuários','Enviar','Usuário','Senha','E-mail','Telefone','Histórico de logins','Transferir pontos','Publicar','Comentários','Assinar'],
  zh: ['问答平台','首页','公共空间','套餐','个人资料','登录','退出','注册','语言','提问','问题','回答','积分','搜索用户','提交','用户名','密码','电子邮件','电话','登录历史','转移积分','发布','评论','订阅'],
  fr: ['Plateforme Q&R','Accueil','Espace public','Forfaits','Profil','Connexion','Déconnexion',"S'inscrire",'Langue','Poser une question','Questions','Réponses','Points','Rechercher des utilisateurs','Envoyer',"Nom d'utilisateur",'Mot de passe','E-mail','Téléphone','Historique de connexion','Transférer des points','Publier','Commentaires',"S'abonner"],
};
export const TRANSLATIONS = Object.fromEntries(Object.entries(ROWS).map(([l, v]) => [l, Object.fromEntries(KEYS.map((k, i) => [k, v[i]]))]));
