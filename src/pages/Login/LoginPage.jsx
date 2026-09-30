import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Modal } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import './LoginPage.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [showFirstAccessModal, setShowFirstAccessModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (!email || !password) {
      addToast('Preencha e-mail e senha.', 'error');
      return;
    }
    
    // Simulate first access logic
    if (password === 'random123') {
      setShowFirstAccessModal(true);
      return;
    }

    addToast('Login realizado com sucesso!', 'success');
    navigate('/doacoes');
  };

  const handleFirstAccessSubmit = () => {
    if (!newPassword || newPassword !== confirmNewPassword) {
      addToast('As senhas não coincidem ou estão vazias.', 'error');
      return;
    }
    addToast('Senha alterada com sucesso!', 'success');
    setShowFirstAccessModal(false);
    navigate('/doacoes');
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="logo-badge">TF</div>
          <h2>Campanha Tiago Fernandes</h2>
          <p>Gestão Financeira</p>
        </div>
        
        <form onSubmit={handleLogin} className="login-form">
          <Input 
            label="E-mail" 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            placeholder="seu@email.com" 
            required 
          />
          <div className="password-input-group">
            <Input 
              label="Senha" 
              type={showPassword ? 'text' : 'password'} 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="Sua senha" 
              required 
            />
            <button 
              type="button" 
              className="toggle-password" 
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
          
          <Button type="submit" className="login-btn" block>Entrar</Button>
          
          <div className="login-links">
            <a href="#forgot" onClick={(e) => { e.preventDefault(); addToast('Recuperação enviada!', 'info'); }}>
              Esqueci minha senha
            </a>
          </div>
        </form>
      </div>

      <Modal 
        isOpen={showFirstAccessModal} 
        onClose={() => setShowFirstAccessModal(false)}
        title="Primeiro Acesso"
      >
        <div className="first-access-form">
          <p>Este é o seu primeiro acesso. Por favor, crie uma nova senha.</p>
          <Input 
            label="Nova Senha" 
            type="password" 
            value={newPassword} 
            onChange={(e) => setNewPassword(e.target.value)} 
          />
          <Input 
            label="Confirmar Nova Senha" 
            type="password" 
            value={confirmNewPassword} 
            onChange={(e) => setConfirmNewPassword(e.target.value)} 
          />
          <div className="modal-actions">
            <Button variant="outline" onClick={() => setShowFirstAccessModal(false)}>Cancelar</Button>
            <Button onClick={handleFirstAccessSubmit}>Salvar Senha e Entrar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
