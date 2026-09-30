import React, { useState } from 'react';
import { PageHeader, Button, Card, Modal, Input, Select, Badge, ConfirmDialog, EmptyState } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import './ContasPage.css';

const mockContas = [
  { id: '1', banco: 'Caixa Econômica Federal', agencia: '1234', conta: '00012345-6', tipo: 'Corrente', descricao: 'Conta Principal da Campanha', status: 'ativa' },
  { id: '2', banco: 'Banco do Brasil', agencia: '5678', conta: '00067890-1', tipo: 'Corrente', descricao: 'Conta Secundária', status: 'ativa' },
  { id: '3', banco: 'Itaú', agencia: '9012', conta: '00098765-4', tipo: 'Poupança', descricao: 'Reserva', status: 'inativa' }
];

export default function ContasPage() {
  const { addToast } = useToast();
  const [contas, setContas] = useState(mockContas);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [currentConta, setCurrentConta] = useState(null);

  const [formData, setFormData] = useState({
    banco: '', agencia: '', conta: '', tipo: 'Corrente', descricao: '', status: 'ativa'
  });

  const handleOpenForm = (conta = null) => {
    if (conta) {
      setFormData({ ...conta });
      setCurrentConta(conta);
    } else {
      setFormData({ banco: '', agencia: '', conta: '', tipo: 'Corrente', descricao: '', status: 'ativa' });
      setCurrentConta(null);
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.banco || !formData.agencia || !formData.conta) {
      addToast('Preencha os campos obrigatórios (Banco, Agência e Conta).', 'error');
      return;
    }

    if (currentConta) {
      setContas(contas.map(c => c.id === currentConta.id ? { ...formData, id: c.id } : c));
      addToast('Conta atualizada com sucesso', 'success');
    } else {
      setContas([...contas, { ...formData, id: Math.random().toString() }]);
      addToast('Conta criada com sucesso', 'success');
    }
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    setContas(contas.filter(c => c.id !== currentConta.id));
    addToast('Conta excluída com sucesso', 'success');
    setIsConfirmOpen(false);
  };

  return (
    <div className="contas-page">
      <PageHeader title="Contas Bancárias" action={<Button onClick={() => handleOpenForm()}>Nova Conta</Button>} />

      {contas.length === 0 ? (
        <EmptyState title="Nenhuma conta cadastrada" description="Adicione uma conta bancária para começar a gerenciar finanças." />
      ) : (
        <div className="contas-grid">
          {contas.map(conta => (
            <Card key={conta.id} className="conta-card">
              <div className="conta-header">
                <h3>{conta.banco}</h3>
                <Badge variant={conta.status === 'ativa' ? 'success' : 'secondary'}>
                  {conta.status === 'ativa' ? 'Ativa' : 'Inativa'}
                </Badge>
              </div>
              <div className="conta-body">
                <p><strong>Agência:</strong> {conta.agencia}</p>
                <p><strong>Conta:</strong> {conta.conta}</p>
                <p><strong>Tipo:</strong> {conta.tipo}</p>
                {conta.descricao && <p className="conta-desc">{conta.descricao}</p>}
              </div>
              <div className="conta-actions">
                <Button variant="outline" size="sm" onClick={() => handleOpenForm(conta)}>Editar</Button>
                <Button variant="outline" className="danger-text" size="sm" onClick={() => { setCurrentConta(conta); setIsConfirmOpen(true); }}>Excluir</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={currentConta ? "Editar Conta" : "Nova Conta"} size="md">
        <div className="form-column">
          <Input label="Nome do Banco" value={formData.banco} onChange={e => setFormData({...formData, banco: e.target.value})} required />
          <Input label="Agência" value={formData.agencia} onChange={e => setFormData({...formData, agencia: e.target.value})} required />
          <Input label="Número da Conta" value={formData.conta} onChange={e => setFormData({...formData, conta: e.target.value})} required />
          <Select 
            label="Tipo" 
            options={[{value:'Corrente', label:'Corrente'}, {value:'Poupança', label:'Poupança'}]} 
            value={formData.tipo} 
            onChange={e => setFormData({...formData, tipo: e.target.value})} 
          />
          <Input label="Descrição/Apelido" value={formData.descricao} onChange={e => setFormData({...formData, descricao: e.target.value})} />
          <Select 
            label="Status" 
            options={[{value:'ativa', label:'Ativa'}, {value:'inativa', label:'Inativa'}]} 
            value={formData.status} 
            onChange={e => setFormData({...formData, status: e.target.value})} 
          />
        </div>
        <div className="modal-actions mt-4">
          <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar</Button>
        </div>
      </Modal>

      <ConfirmDialog isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={handleDelete} title="Excluir Conta" message="Deseja realmente excluir esta conta bancária?" />
    </div>
  );
}
