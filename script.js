const form = document.getElementById("payment-form");
const installmentsSelect = document.getElementById("installments");
const result = document.getElementById("result");

// Obter taxas de parcelamento ao carregar a página
async function fetchFees() {
  const response = await fetch("https://projeto-cc.vercel.app/api/fees"); // URL de produção
  const fees = await response.json();

  console.log(fees); // Adicionar log para verificar a estrutura dos dados

  // Adicionar opções de parcelamento ao select
  installmentsSelect.innerHTML = "";
  Object.entries(fees).forEach(([key, value]) => {
    if (key.startsWith("credito")) {
      const parcelas = key === "credito" ? 1 : parseInt(key.replace("credito", ""));
      const option = document.createElement("option");
      option.value = parcelas;
      option.textContent = `${parcelas}x - Taxa: ${value}%`;
      installmentsSelect.appendChild(option);
    }
  });
}

// Enviar pagamento
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const parcelas = parseInt(installmentsSelect.value);
  const taxa = parseFloat(
    installmentsSelect.options[installmentsSelect.selectedIndex].textContent.split(": ")[1].replace("%", "")
  );
  console.log("Taxa selecionada: ", taxa); // Verificar valor da taxa
  
  const amount = parseFloat(document.getElementById("amount").value);
  const total = amount + (amount * taxa) / 100;
  console.log("Total calculado: ", total); // Verificar cálculo do total

  const paymentData = {
    client: {
      name: document.getElementById("name").value,
      document: document.getElementById("cpf").value,
    },
    card: {
      number: document.getElementById("card-number").value,
      expirationMonth: document.getElementById("expiration").value.split("/")[0],
      expirationYear: document.getElementById("expiration").value.split("/")[1],
      cvv: document.getElementById("cvv").value,
      installment: parcelas,
      amount: total.toFixed(2),
    },
  };

  const response = await fetch("https://projeto-cc.vercel.app/api/pay", {  // Alterado para domínio de produção
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(paymentData),
  });

  const resultData = await response.json();
  console.log("Resposta da API de pagamento:", resultData); // Verificar resposta do pagamento
  result.textContent = JSON.stringify(resultData, null, 2);
});

// Carregar taxas ao inicializar
fetchFees();
