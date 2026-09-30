import React, { useState } from 'react';
import { PageHeader, DataTable, Button, Modal, Input, Badge, ConfirmDialog } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import './UsuariosPage.css';

const mockUsuarios = [
  { id: '1', email: 'neymaran.filho@gmail.com', nome: 'Neymaran Filho', status: 'ativo', criadoEm: '01/01/2026', ultimoAcesso: '30/09/2026' },
  { id: '2', email: 'maria@example.com', nome: 'Maria Santos', status: 'ativo', criadoEm: '15/03/2026', ultimoAcesso: '28/09/2026' },
  { id: '3', email: 'carlos@example.com', nome: 'Carlos Oliveira', status: 'inativo', criadoEm: '20/05/2026', ultimoAcesso: '15/08/2026' }
];

const generatePassword = () => Math.random().toString(36).slice(-12).toUpperCase();

export default function UsuariosPage() {
  const { addToast } = useToast();
  const [usuarios, setUsuarios] = useState(mockUsuarios);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [currentUsuario, setCurrentUsuario] = useState(null);

  const [formData, setFormData] = useState({ nome: '', email: '', senha: '' });

  const handleOpenForm = (user = null) => {
    if (user) {
      setFormData({ nome: user.nome, email: user.email, senha: '' });
      setCurrentUsuario(user);
    } else {
      setFormData({ nome: '', email: '', senha: generatePassword() });
      setCurrentUsuario(null);
    }
    setIsModalOpen(true);
  };

  const handleRegeneratePassword = () => {
    setFormData({ ...formData, senha: generatePassword() });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(formData.senha);
    addToast('Senha copiada!', 'info');
  };

  const handleSave = () => {
    if (!formData.nome || !formData.email) {
      addToast('Nome e e-mail são obrigatórios.', 'error');
      return;
    }

    if (currentUsuario) {
      setUsuarios(usuarios.map(u => u.id === currentUsuario.id ? { ...u, nome: formData.nome } : u));
      addToast('Usuário atualizado com sucesso', 'success');
      if (formData.senha) {
        addToast('Nova senha gerada para o usuário.', 'info');
      }
    } else {
      const novo = {
        id: Math.random().toString(),
        email: formData.email,
        nome: formData.nome,
        status: 'ativo',
        criadoEm: new Date().toLocaleDateString('pt-BR'),
        ultimoAcesso: '-'
      };
      setUsuarios([...usuarios, novo]);
      addToast('Usuário criado com sucesso', 'success');
    }
    setIsModalOpen(false);
  };

  const toggleStatus = (user) => {
    const novoStatus = user.status === 'ativo' ? 'inativo' : 'ativo';
    setUsuarios(usuarios.map(u => u.id === user.id ? { ...u, status: novoStatus } : u));
    addToast(`Usuário ${novoStatus === 'ativo' ? 'ativado' : 'inativado'}.`, 'info');
  };

  const handleDelete = () => {
    setUsuarios(usuarios.filter(u => u.id !== currentUsuario.id));
    addToast('Usuário excluído', 'success');
    setIsConfirmOpen(false);
  };

  const columns = [
    { key: 'nome', label: 'Nome' },
    { key: 'email', label: 'Email' },
    { key: 'statusBadge', label: 'Status' },
    { key: 'criadoEm', label: 'Criado em' },
    { key: 'ultimoAcesso', label: 'Último Acesso' },
    { key: 'actions', label: 'Ações' }
  ];

  const dataWithActions = usuarios.map(u => ({
    ...u,
    statusBadge: <Badge variant={u.status === 'ativo' ? 'success' : 'secondary'}>{u.status === 'ativo' ? 'Ativo' : 'Inativo'}</Badge>,
    actions: (
      <div className="action-buttons">
        <Button variant="icon" onClick={() => handleOpenForm(u)}>✏️</Button>
        <Button variant="icon" onClick={() => toggleStatus(u)} title={u.status === 'ativo' ? 'Inativar' : 'Ativar'}>🔄</Button>
        <Button variant="icon" className="danger" onClick={() => { setCurrentUsuario(u); setIsConfirmOpen(true); }}>🗑️</Button>
      </div>
    )
  }));

  return (
    <div className="usuarios-page">
      <PageHeader title="Usuários" action={<Button onClick={() => handleOpenForm()}>Novo Usuário</Button>} />

      <DataTable columns={columns} data={dataWithActions} />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={currentUsuario ? "Editar Usuário" : "Novo Usuário"} size="md">
        <div className="form-column">
          <Input label="Nome Completo" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} required />
          <Input label="E-mail" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required disabled={!!currentUsuario} />
          
          <div className="password-generator">
            <p><strong>{currentUsuario ? "Reset de Senha (opcional)" : "Senha Gerada:"}</strong></p>
            {formData.senha ? (
              <div className="senha-box">
                <code>{formData.senha}</code>
                <Button variant="icon" onClick={copyToClipboard} title="Copiar">📋</Button>
              </div>
            ) : null}
            <div className="mt-2">
              <Button variant="outline" size="sm" onClick={handleRegeneratePassword}>
                {currentUsuario ? "Gerar Nova Senha" : "Regerar Senha"}
              </Button>
            </div>
            <p className="help-text">O usuário deverá trocar a senha no primeiro acesso.</p>
          </div>
        </div>
        <div className="modal-actions mt-4">
          <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar</Button>
        </div>
      </Modal>

      <ConfirmDialog isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={handleDelete} title="Excluir Usuário" message="Deseja remover este usuário permanentemente?" />
    </div>
  );
}
