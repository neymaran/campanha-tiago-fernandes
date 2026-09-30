const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { Resend } = require('resend');

admin.initializeApp();

exports.createUserAndSendEmail = functions.https.onCall(async (data, context) => {
  const resend = new Resend(process.env.RESEND_API_KEY);
  // Verifica se o usuário que chamou a função está autenticado
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Você precisa estar logado para criar um novo usuário.'
    );
  }

  const { email, nome, password } = data;

  if (!email || !nome || !password) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Email, nome e senha são obrigatórios.'
    );
  }

  try {
    // 1. Cria o usuário no Firebase Auth
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: nome,
    });

    // 2. Salva os dados do usuário no Firestore
    await admin.firestore().collection('usuarios').doc(userRecord.uid).set({
      nome: nome,
      email: email,
      status: 'ativo',
      criadoEm: admin.firestore.FieldValue.serverTimestamp(),
      ultimoAcesso: null,
      firstAccess: true // Flag para forçar a troca de senha no primeiro login
    });

    // 3. Envia e-mail de boas-vindas com a senha via Resend
    await resend.emails.send({
      from: 'Sistema de Campanha <info@naryen.com>',
      to: [email],
      subject: 'Bem-vindo ao Sistema de Gestão Financeira',
      html: `
        <h2>Olá, ${nome}!</h2>
        <p>Sua conta no Sistema de Gestão Financeira da Campanha Tiago Fernandes foi criada com sucesso.</p>
        <p>Para acessar, utilize os seguintes dados:</p>
        <ul>
          <li><strong>URL de Acesso:</strong> <a href="https://campanhatf.naryen.com">campanhatf.naryen.com</a></li>
          <li><strong>E-mail:</strong> ${email}</li>
          <li><strong>Senha temporária:</strong> ${password}</li>
        </ul>
        <p><em>Atenção: Por questões de segurança, você deverá alterar esta senha no seu primeiro acesso.</em></p>
        <br>
        <p>Atenciosamente,<br>Equipe de Campanha Tiago Fernandes</p>
      `
    });

    return { 
      success: true, 
      message: 'Usuário criado e e-mail enviado com sucesso.',
      uid: userRecord.uid
    };

  } catch (error) {
    console.error("Erro ao criar usuário: ", error);
    throw new functions.https.HttpsError('internal', error.message || 'Erro interno ao criar usuário.');
  }
});
