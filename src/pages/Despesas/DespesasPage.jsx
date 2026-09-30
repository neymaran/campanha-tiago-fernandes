import React, { useState } from 'react';
import { 
  PageHeader, DataTable, Button, Modal, Input, MaskedInput, 
  Select, Badge, StatsCard, ConfirmDialog 
} from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import './DespesasPage.css';

const mockDespesas = [
  {
    id: '1',
    cpfCnpj: '12.345.678/0001-90',
    nomeFornecedor: 'Gráfica Express Ltda',
    dataContratacao: '10/04/2026',
    itens: [
      { id: '1', descricao: 'Santinhos 14x10cm', quantidade: 10000, valorUnitario: 0.15, total: 1500 },
      { id: '2', descricao: 'Adesivos', quantidade: 5000, valorUnitario: 0.30, total: 1500 }
    ],
    totalDespesa: 3000,
    pagamentos: [
      { id: '1', data: '10/04/2026', valor: 1500, numeroDocumento: 'PIX-001', contaOrigem: 'Caixa Econômica' },
      { id: '2', data: '15/04/2026', valor: 1500, numeroDocumento: 'PIX-002', contaOrigem: 'Caixa Econômica' }
    ],
    totalPago: 3000,
    status: 'pago'
  },
  {
    id: '2',
    cpfCnpj: '98.765.432/0001-10',
    nomeFornecedor: 'Agência de Marketing XPTO',
    dataContratacao: '12/04/2026',
    itens: [
      { id: '3', descricao: 'Gestão de Redes Sociais', quantidade: 1, valorUnitario: 5000, total: 5000 }
    ],
    totalDespesa: 5000,
    pagamentos: [
      { id: '3', data: '12/04/2026', valor: 2500, numeroDocumento: 'TED-01', contaOrigem: 'Banco do Brasil' }
    ],
    totalPago: 2500,
    status: 'parcial'
  },
  {
    id: '3',
    cpfCnpj: '111.222.333-44',
    nomeFornecedor: 'João Motorista',
    dataContratacao: '15/04/2026',
    itens: [
      { id: '4', descricao: 'Locação de Veículo', quantidade: 1, valorUnitario: 2000, total: 2000 }
    ],
    totalDespesa: 2000,
    pagamentos: [],
    totalPago: 0,
    status: 'pendente'
  },
  {
    id: '4',
    cpfCnpj: '55.666.777/0001-88',
    nomeFornecedor: 'Posto de Gasolina BR',
    dataContratacao: '18/04/2026',
    itens: [
      { id: '5', descricao: 'Combustível', quantidade: 100, valorUnitario: 6.00, total: 600 }
    ],
    totalDespesa: 600,
    pagamentos: [
      { id: '4', data: '18/04/2026', valor: 600, numeroDocumento: 'DOC-99', contaOrigem: 'Itaú' }
    ],
    totalPago: 600,
    status: 'pago'
  }
];

const contasMock = [
  { value: 'Caixa Econômica', label: 'Caixa Econômica - 1234' },
  { value: 'Banco do Brasil', label: 'Banco do Brasil - 5678' },
  { value: 'Itaú', label: 'Itaú - 9012' }
];

export default function DespesasPage() {
  const { addToast } = useToast();
  const [despesas, setDespesas] = useState(mockDespesas);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [currentDespesa, setCurrentDespesa] = useState(null);

  const [formData, setFormData] = useState({
    cpfCnpj: '', nomeFornecedor: '', dataContratacao: '', itens: [], pagamentos: []
  });

  const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const calculateTotal = (items) => items.reduce((acc, i) => acc + (parseFloat(i.quantidade||0) * parseFloat(i.valorUnitario||0)), 0);
  const calculatePago = (payments) => payments.reduce((acc, p) => acc + parseFloat(p.valor||0), 0);

  const determineStatus = (total, pago) => {
    if (pago === 0) return 'pendente';
    if (pago >= total) return 'pago';
    return 'parcial';
  };

  const handleOpenForm = (despesa = null) => {
    if (despesa) {
      setFormData({ ...despesa });
      setCurrentDespesa(despesa);
    } else {
      setFormData({ cpfCnpj: '', nomeFornecedor: '', dataContratacao: '', itens: [], pagamentos: [] });
      setCurrentDespesa(null);
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.nomeFornecedor || formData.itens.length === 0) {
      addToast('Preencha os campos obrigatórios e adicione ao menos um item.', 'error');
      return;
    }
    const tDespesa = calculateTotal(formData.itens);
    const tPago = calculatePago(formData.pagamentos);
    const novoStatus = determineStatus(tDespesa, tPago);

    const updated = {
      ...formData,
      totalDespesa: tDespesa,
      totalPago: tPago,
      status: novoStatus,
      id: currentDespesa ? currentDespesa.id : Math.random().toString()
    };

    if (currentDespesa) {
      setDespesas(despesas.map(d => d.id === currentDespesa.id ? updated : d));
      addToast('Despesa atualizada com sucesso!', 'success');
    } else {
      setDespesas([updated, ...despesas]);
      addToast('Despesa registrada com sucesso!', 'success');
    }
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    setDespesas(despesas.filter(d => d.id !== currentDespesa.id));
    addToast('Despesa excluída com sucesso', 'success');
    setIsConfirmOpen(false);
  };

  const addItem = () => setFormData({ ...formData, itens: [...formData.itens, { id: Math.random().toString(), descricao: '', quantidade: 1, valorUnitario: 0, total: 0 }] });
  const removeItem = (id) => setFormData({ ...formData, itens: formData.itens.filter(i => i.id !== id) });
  const updateItem = (id, field, value) => {
    const newItems = formData.itens.map(i => {
      if (i.id === id) {
        const updated = { ...i, [field]: value };
        updated.total = parseFloat(updated.quantidade||0) * parseFloat(updated.valorUnitario||0);
        return updated;
      }
      return i;
    });
    setFormData({ ...formData, itens: newItems });
  };

  const addPagamento = () => setFormData({ ...formData, pagamentos: [...formData.pagamentos, { id: Math.random().toString(), data: '', valor: 0, numeroDocumento: '', contaOrigem: '' }] });
  const removePagamento = (id) => setFormData({ ...formData, pagamentos: formData.pagamentos.filter(p => p.id !== id) });
  const updatePagamento = (id, field, value) => setFormData({ ...formData, pagamentos: formData.pagamentos.map(p => p.id === id ? { ...p, [field]: value } : p) });

  const totalGeral = despesas.reduce((acc, curr) => acc + curr.totalDespesa, 0);
  const totalGeralPago = despesas.reduce((acc, curr) => acc + curr.totalPago, 0);
  const totalGeralPendente = totalGeral - totalGeralPago;

  const dataWithActions = despesas.map(d => ({
    ...d,
    valorTotal: formatCurrency(d.totalDespesa),
    pagoFormatado: formatCurrency(d.totalPago),
    statusBadge: <Badge variant={d.status === 'pago' ? 'success' : d.status === 'parcial' ? 'warning' : 'danger'}>{d.status.toUpperCase()}</Badge>,
    actions: (
      <div className="action-buttons">
        <Button variant="icon" onClick={() => { setCurrentDespesa(d); setIsViewModalOpen(true); }}>👁️</Button>
        <Button variant="icon" onClick={() => handleOpenForm(d)}>✏️</Button>
        <Button variant="icon" className="danger" onClick={() => { setCurrentDespesa(d); setIsConfirmOpen(true); }}>🗑️</Button>
      </div>
    )
  }));

  return (
    <div className="despesas-page">
      <PageHeader title="Despesas" action={<Button onClick={() => handleOpenForm()}>Nova Despesa</Button>} />

      <div className="stats-container">
        <StatsCard title="Total de Despesas" value={formatCurrency(totalGeral)} />
        <StatsCard title="Total Pago" value={formatCurrency(totalGeralPago)} />
        <StatsCard title="Total Pendente" value={formatCurrency(totalGeralPendente)} />
      </div>

      <DataTable 
        columns={[
          { key: 'dataContratacao', label: 'Data' },
          { key: 'nomeFornecedor', label: 'Fornecedor' },
          { key: 'cpfCnpj', label: 'CPF/CNPJ' },
          { key: 'valorTotal', label: 'Valor Total' },
          { key: 'pagoFormatado', label: 'Pago' },
          { key: 'statusBadge', label: 'Status' },
          { key: 'actions', label: 'Ações' }
        ]} 
        data={dataWithActions} 
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={currentDespesa ? "Editar Despesa" : "Nova Despesa"} size="xl">
        <div className="form-grid mb-4">
          <Input label="CPF ou CNPJ" value={formData.cpfCnpj} onChange={(e) => setFormData({...formData, cpfCnpj: e.target.value})} placeholder="Digite para buscar..." />
          <Input label="Fornecedor" value={formData.nomeFornecedor} onChange={(e) => setFormData({...formData, nomeFornecedor: e.target.value})} required />
          <MaskedInput mask="date" label="Data de Contratação" value={formData.dataContratacao} onChange={(e) => setFormData({...formData, dataContratacao: e.target.value})} />
        </div>

        <div className="bordered-card">
          <h4>Itens da Despesa</h4>
          <table className="items-table">
            <thead>
              <tr>
                <th>Descrição</th>
                <th>Qtd</th>
                <th>Valor Unitário</th>
                <th>Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {formData.itens.map(item => (
                <tr key={item.id}>
                  <td><Input value={item.descricao} onChange={(e) => updateItem(item.id, 'descricao', e.target.value)} /></td>
                  <td><Input type="number" value={item.quantidade} onChange={(e) => updateItem(item.id, 'quantidade', e.target.value)} /></td>
                  <td><Input type="number" step="0.01" value={item.valorUnitario} onChange={(e) => updateItem(item.id, 'valorUnitario', e.target.value)} /></td>
                  <td>{formatCurrency(item.total)}</td>
                  <td><Button variant="icon" className="danger" onClick={() => removeItem(item.id)}>❌</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <Button variant="outline" size="sm" onClick={addItem} className="mt-2">+ Adicionar Item</Button>
          <div className="total-geral"><strong>Total Geral:</strong> {formatCurrency(calculateTotal(formData.itens))}</div>
        </div>

        <div className="bordered-card mt-4">
          <h4>Pagamentos</h4>
          <p className="summary-text">
            Total da despesa: <strong>{formatCurrency(calculateTotal(formData.itens))}</strong> | 
            Total já pago: <strong>{formatCurrency(calculatePago(formData.pagamentos))}</strong> | 
            Saldo: <strong>{formatCurrency(calculateTotal(formData.itens) - calculatePago(formData.pagamentos))}</strong>
          </p>
          <table className="items-table mt-2">
            <thead>
              <tr>
                <th>Data</th>
                <th>Valor</th>
                <th>Nº Documento</th>
                <th>Conta Origem</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {formData.pagamentos.map(pag => (
                <tr key={pag.id}>
                  <td><MaskedInput mask="date" value={pag.data} onChange={(e) => updatePagamento(pag.id, 'data', e.target.value)} /></td>
                  <td><Input type="number" step="0.01" value={pag.valor} onChange={(e) => updatePagamento(pag.id, 'valor', e.target.value)} /></td>
                  <td><Input value={pag.numeroDocumento} onChange={(e) => updatePagamento(pag.id, 'numeroDocumento', e.target.value)} /></td>
                  <td><Select options={contasMock} value={pag.contaOrigem} onChange={(e) => updatePagamento(pag.id, 'contaOrigem', e.target.value)} /></td>
                  <td><Button variant="icon" className="danger" onClick={() => removePagamento(pag.id)}>❌</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <Button variant="outline" size="sm" onClick={addPagamento} className="mt-2">+ Adicionar Pagamento</Button>
        </div>

        <div className="modal-actions mt-4">
          <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar</Button>
        </div>
      </Modal>

      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Detalhes da Despesa" size="lg">
        {currentDespesa && (
          <div className="view-details">
            <div className="details-header">
              <p><strong>Fornecedor:</strong> {currentDespesa.nomeFornecedor} ({currentDespesa.cpfCnpj})</p>
              <p><strong>Data:</strong> {currentDespesa.dataContratacao}</p>
              <p><strong>Status:</strong> {currentDespesa.status.toUpperCase()}</p>
            </div>
            <div className="mt-4">
              <h4>Itens</h4>
              <ul>
                {currentDespesa.itens.map(i => (
                  <li key={i.id}>{i.quantidade}x {i.descricao} - {formatCurrency(i.valorUnitario)} = {formatCurrency(i.total)}</li>
                ))}
              </ul>
              <p><strong>Total da Despesa:</strong> {formatCurrency(currentDespesa.totalDespesa)}</p>
            </div>
            <div className="mt-4">
              <h4>Pagamentos</h4>
              <ul>
                {currentDespesa.pagamentos.map(p => (
                  <li key={p.id}>{p.data} - {formatCurrency(p.valor)} ({p.numeroDocumento} / {p.contaOrigem})</li>
                ))}
                {currentDespesa.pagamentos.length === 0 && <li>Nenhum pagamento registrado.</li>}
              </ul>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={handleDelete} title="Excluir Despesa" message="Deseja realmente excluir?" />
    </div>
  );
}
