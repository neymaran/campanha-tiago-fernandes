import React, { useState, useEffect } from 'react';
import { PageHeader, Button, Card, Input, Select, Badge, ConfirmDialog, EmptyState, Skeleton } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import { collection, query, onSnapshot, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import './ContasPage.css';

export default function ContasPage() {
  const { addToast } = useToast();
  const [contas, setContas] = useState([]);
  const [viewMode, setViewMode] = useState('list');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [currentConta, setCurrentConta] = useState(null);

  const [formData, setFormData] = useState({
    banco: '', agencia: '', conta: '', tipo: 'Corrente', descricao: '', status: 'ativa'
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'contas'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const contasData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setContas(contasData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleOpenForm = (conta = null) => {
    if (conta) {
      setFormData({ ...conta });
      setCurrentConta(conta);
    } else {
      setFormData({ banco: '', agencia: '', conta: '', tipo: 'Corrente', descricao: '', status: 'ativa' });
      setCurrentConta(null);
    }
    setViewMode('form');
    window.scrollTo(0, 0);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    if (!formData.banco || !formData.agencia || !formData.conta) {
      addToast('Preencha os campos obrigatórios (Banco, Agência e Conta).', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (currentConta) {
        const contaRef = doc(db, 'contas', currentConta.id);
        await updateDoc(contaRef, { ...formData });
        addToast('Conta atualizada com sucesso', 'success');
      } else {
        await addDoc(collection(db, 'contas'), { ...formData });
        addToast('Conta criada com sucesso', 'success');
      }
      setViewMode('list');
    } catch (error) {
      addToast('Erro ao salvar conta', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      if (currentConta) {
        await deleteDoc(doc(db, 'contas', currentConta.id));
        addToast('Conta excluída com sucesso', 'success');
      }
    } catch (error) {
      addToast('Erro ao excluir conta', 'error');
    }
    setIsConfirmOpen(false);
  };

  return (
    <div className="contas-page">
      {viewMode === 'list' ? (
        <>
          <PageHeader title="Contas Bancárias" actions={<Button onClick={() => handleOpenForm()}>Nova Conta</Button>} />

          {isLoading ? (
            <div className="contas-grid">
              {Array.from({ length: 3 }).map((_, idx) => (
                <Card key={`skel-${idx}`} className="conta-card">
                  <div style={{ padding: '20px' }}>
                    <Skeleton height="24px" width="60%" />
                    <Skeleton height="16px" width="100%" />
                    <Skeleton height="16px" width="80%" />
                    <Skeleton height="16px" width="90%" />
                    <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                      <Skeleton height="32px" width="80px" />
                      <Skeleton height="32px" width="80px" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : contas.length === 0 ? (
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
        </>
      ) : (
        <>
          <PageHeader 
            title={currentConta ? "Editar Conta" : "Nova Conta"} 
            actions={<Button variant="outline" onClick={() => setViewMode('list')}>← Voltar</Button>} 
          />
          <Card className="form-card">
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
              <Button variant="outline" onClick={() => setViewMode('list')} disabled={isSubmitting}>Cancelar</Button>
              <Button onClick={handleSave} isLoading={isSubmitting}>{isSubmitting ? 'Salvando...' : 'Salvar'}</Button>
            </div>
          </Card>
        </>
      )}

      <ConfirmDialog isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={handleDelete} title="Excluir Conta" message="Deseja realmente excluir esta conta bancária?" />
    </div>
  );
}
