import React, { useState } from 'react';
import { 
  PageHeader, DataTable, Button, Modal, Input, MaskedInput, 
  FileUpload, StatsCard, ConfirmDialog 
} from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import './DoacoesPage.css';

const mockData = [
  { id: '1', data: '15/03/2026', nomeDoador: 'João Carlos da Silva', valor: 5000.00, cpf: '123.456.789-00', numeroDocumento: 'DOC-001', identidades: [{ name: 'rg_frente.pdf', size: 1024000 }], createdAt: '2026-03-15T10:00:00' },
  { id: '2', data: '16/03/2026', nomeDoador: 'Maria Oliveira', valor: 1500.00, cpf: '234.567.890-11', numeroDocumento: 'DOC-002', identidades: [], createdAt: '2026-03-16T11:30:00' },
  { id: '3', data: '17/03/2026', nomeDoador: 'Carlos Souza', valor: 300.00, cpf: '345.678.901-22', numeroDocumento: 'DOC-003', identidades: [], createdAt: '2026-03-17T09:15:00' },
  { id: '4', data: '18/03/2026', nomeDoador: 'Ana Costa', valor: 10000.00, cpf: '456.789.012-33', numeroDocumento: 'DOC-004', identidades: [], createdAt: '2026-03-18T14:45:00' },
  { id: '5', data: '19/03/2026', nomeDoador: 'Pedro Santos', valor: 250.00, cpf: '567.890.123-44', numeroDocumento: 'DOC-005', identidades: [], createdAt: '2026-03-19T16:20:00' },
];

export default function DoacoesPage() {
  const { addToast } = useToast();
  const [doacoes, setDoacoes] = useState(mockData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [currentDoacao, setCurrentDoacao] = useState(null);
  
  const [formData, setFormData] = useState({
    data: '', nomeDoador: '', valor: '', cpf: '', numeroDocumento: '', identidades: []
  });

  const totalValor = doacoes.reduce((acc, curr) => acc + curr.valor, 0);

  const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const columns = [
    { key: 'data', label: 'Data' },
    { key: 'nomeDoador', label: 'Doador' },
    { key: 'cpf', label: 'CPF' },
    { key: 'valorFormatted', label: 'Valor' },
    { key: 'numeroDocumento', label: 'Nº Documento' },
    { key: 'actions', label: 'Ações' }
  ];

  const handleOpenForm = (doacao = null) => {
    if (doacao) {
      setFormData({ ...doacao, valor: doacao.valor.toString() });
      setCurrentDoacao(doacao);
    } else {
      setFormData({ data: '', nomeDoador: '', valor: '', cpf: '', numeroDocumento: '', identidades: [] });
      setCurrentDoacao(null);
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.data || !formData.nomeDoador || !formData.valor || !formData.cpf) {
      addToast('Preencha os campos obrigatórios', 'error');
      return;
    }
    
    if (currentDoacao) {
      setDoacoes(doacoes.map(d => d.id === currentDoacao.id ? { ...formData, id: d.id, valor: parseFloat(formData.valor) } : d));
      addToast('Doação atualizada com sucesso', 'success');
    } else {
      const newDoacao = { ...formData, id: Math.random().toString(), valor: parseFloat(formData.valor) };
      setDoacoes([newDoacao, ...doacoes]);
      addToast('Doação registrada com sucesso', 'success');
    }
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    setDoacoes(doacoes.filter(d => d.id !== currentDoacao.id));
    addToast('Doação excluída com sucesso', 'success');
    setIsConfirmOpen(false);
  };

  const dataWithActions = doacoes.map(d => ({
    ...d,
    valorFormatted: formatCurrency(d.valor),
    actions: (
      <div className="action-buttons">
        <Button variant="icon" onClick={() => { setCurrentDoacao(d); setIsViewModalOpen(true); }}>👁️</Button>
        <Button variant="icon" onClick={() => handleOpenForm(d)}>✏️</Button>
        <Button variant="icon" className="danger" onClick={() => { setCurrentDoacao(d); setIsConfirmOpen(true); }}>🗑️</Button>
      </div>
    )
  }));

  return (
    <div className="doacoes-page">
      <PageHeader 
        title="Doações" 
        action={<Button onClick={() => handleOpenForm()}>Nova Doação</Button>} 
      />

      <div className="stats-container">
        <StatsCard title="Total de Doações" value={doacoes.length} />
        <StatsCard title="Valor Total" value={formatCurrency(totalValor)} />
      </div>

      <div className="filter-bar">
        <Input placeholder="Buscar por nome..." />
        <MaskedInput mask="date" placeholder="Data inicial" />
        <MaskedInput mask="date" placeholder="Data final" />
      </div>

      <DataTable columns={columns} data={dataWithActions} />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={currentDoacao ? "Editar Doação" : "Nova Doação"} size="lg">
        <div className="form-grid">
          <MaskedInput mask="date" label="Data da doação" value={formData.data} onChange={(e) => setFormData({...formData, data: e.target.value})} required />
          <Input label="Nome Completo do Doador" value={formData.nomeDoador} onChange={(e) => setFormData({...formData, nomeDoador: e.target.value})} required />
          <MaskedInput mask="currency" label="Valor (R$)" value={formData.valor} onChange={(e) => setFormData({...formData, valor: e.target.value})} required />
          <MaskedInput mask="cpf" label="CPF" value={formData.cpf} onChange={(e) => setFormData({...formData, cpf: e.target.value})} required />
          <Input label="Nº do Documento no extrato" value={formData.numeroDocumento} onChange={(e) => setFormData({...formData, numeroDocumento: e.target.value})} required />
        </div>
        <div className="mt-4">
          <FileUpload label="Identidade do Doador" multiple accept=".pdf,image/*" onChange={(files) => setFormData({...formData, identidades: Array.from(files)})} />
        </div>
        <div className="modal-actions mt-4">
          <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar</Button>
        </div>
      </Modal>

      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Detalhes da Doação">
        {currentDoacao && (
          <div className="view-details">
            <p><strong>Data:</strong> {currentDoacao.data}</p>
            <p><strong>Doador:</strong> {currentDoacao.nomeDoador}</p>
            <p><strong>CPF:</strong> {currentDoacao.cpf}</p>
            <p><strong>Valor:</strong> {formatCurrency(currentDoacao.valor)}</p>
            <p><strong>Documento:</strong> {currentDoacao.numeroDocumento}</p>
            <div className="mt-4">
              <h4>Documentos Anexados:</h4>
              <ul>
                {currentDoacao.identidades?.map((f, i) => <li key={i}>{f.name}</li>)}
                {(!currentDoacao.identidades || currentDoacao.identidades.length === 0) && <li>Nenhum documento anexado.</li>}
              </ul>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog 
        isOpen={isConfirmOpen} 
        onClose={() => setIsConfirmOpen(false)} 
        onConfirm={handleDelete} 
        title="Excluir Doação" 
        message="Tem certeza que deseja excluir esta doação? Esta ação não pode ser desfeita." 
      />
    </div>
  );
}
