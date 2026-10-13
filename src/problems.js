export const PROBLEMS = [
  {
    id: 'two-sum',
    number: 1,
    title: 'Two Sum (Soma de Dois)',
    difficulty: 'Fácil',
    tags: ['Array', 'Hash Map', 'LeetCode #1'],
    description: `Dado um array de inteiros <code>nums</code> e um inteiro <code>target</code>, retorne os <strong>índices dos dois números</strong> cuja soma seja igual a <code>target</code>.
    <br><br>
    Você pode assumir que cada entrada tem exatamente uma solução, e você não pode usar o mesmo elemento duas vezes.`,
    defaultCode: `function twoSum(nums, target) {
  // Criamos um mapa para guardar { valor: índice }
  const map = new Map();
  
  for (let i = 0; i < nums.length; i++) {
    const diff = target - nums[i];
    
    // Se a diferença já foi vista, encontramos o par!
    if (map.has(diff)) {
      return [map.get(diff), i];
    }
    
    // Armazena o número atual e seu índice
    map.set(nums[i], i);
  }
  
  return [];
}

// Teste o algoritmo com os argumentos abaixo:
twoSum([2, 7, 11, 15], 9);`,
    testCases: [
      { id: 1, name: 'Exemplo 1', args: [[2, 7, 11, 15], 9], expected: [0, 1] },
      { id: 2, name: 'Exemplo 2', args: [[3, 2, 4], 6], expected: [1, 2] },
      { id: 3, name: 'Exemplo 3', args: [[3, 3], 6], expected: [0, 1] }
    ]
  },
  {
    id: 'reverse-string',
    number: 344,
    title: 'Reverse String (Inverter Array de Caracteres)',
    difficulty: 'Fácil',
    tags: ['Dois Ponteiros', 'Array', 'LeetCode #344'],
    description: `Escreva uma função que inverte uma string recebida como array de caracteres <code>s</code>.
    <br><br>
    A inversão deve ser feita <strong>in-place</strong> com complexidade de memória <code>O(1)</code> utilizando dois ponteiros (<code>left</code> e <code>right</code>).`,
    defaultCode: `function reverseString(s) {
  let left = 0;
  let right = s.length - 1;
  
  while (left < right) {
    // Troca os elementos das duas pontas
    const temp = s[left];
    s[left] = s[right];
    s[right] = temp;
    
    // Avança os ponteiros em direção ao centro
    left++;
    right--;
  }
  
  return s;
}

reverseString(["h", "e", "l", "l", "o"]);`,
    testCases: [
      { id: 1, name: 'Exemplo 1 ("hello")', args: [["h", "e", "l", "l", "o"]], expected: ["o", "l", "l", "e", "h"] },
      { id: 2, name: 'Exemplo 2 ("Hannah")', args: [["H", "a", "n", "n", "a", "h"]], expected: ["h", "a", "n", "n", "a", "H"] }
    ]
  },
  {
    id: 'valid-palindrome',
    number: 125,
    title: 'Valid Palindrome (Palíndromo Válido)',
    difficulty: 'Fácil',
    tags: ['Dois Ponteiros', 'Strings', 'LeetCode #125'],
    description: `Uma frase é um <strong>palíndromo</strong> se, após converter todas as letras para minúsculas e remover todos os caracteres não-alfanuméricos, ela for lida da mesma forma de trás para frente.`,
    defaultCode: `function isPalindrome(s) {
  // Limpa caracteres especiais e deixa em minúsculas
  const clean = s.toLowerCase().replace(/[^a-z0-9]/g, '');
  let left = 0;
  let right = clean.length - 1;
  
  while (left < right) {
    if (clean[left] !== clean[right]) {
      return false;
    }
    left++;
    right--;
  }
  
  return true;
}

isPalindrome("A man, a plan, a canal: Panama");`,
    testCases: [
      { id: 1, name: 'Exemplo 1 (Palíndromo clássico)', args: ["A man, a plan, a canal: Panama"], expected: true },
      { id: 2, name: 'Exemplo 2 (Não palíndromo)', args: ["race a car"], expected: false },
      { id: 3, name: 'Exemplo 3 (String vazia)', args: [" "], expected: true }
    ]
  },
  {
    id: 'binary-search',
    number: 704,
    title: 'Binary Search (Busca Binária)',
    difficulty: 'Fácil',
    tags: ['Busca Binária', 'Array', 'LeetCode #704'],
    description: `Dado um array ordenado de inteiros <code>nums</code> e um número <code>target</code>, escreva uma função para buscar <code>target</code> em <code>nums</code>.
    <br><br>
    Se o elemento existir, retorne seu índice. Caso contrário, retorne <code>-1</code>. O algoritmo deve rodar em tempo <code>O(log n)</code>.`,
    defaultCode: `function search(nums, target) {
  let low = 0;
  let high = nums.length - 1;
  
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    
    if (nums[mid] === target) {
      return mid; // Encontrado!
    } else if (nums[mid] < target) {
      low = mid + 1; // Busca na metade direita
    } else {
      high = mid - 1; // Busca na metade esquerda
    }
  }
  
  return -1;
}

search([-1, 0, 3, 5, 9, 12], 9);`,
    testCases: [
      { id: 1, name: 'Exemplo 1 (Elemento 9 existe)', args: [[-1, 0, 3, 5, 9, 12], 9], expected: 4 },
      { id: 2, name: 'Exemplo 2 (Elemento 2 não existe)', args: [[-1, 0, 3, 5, 9, 12], 2], expected: -1 }
    ]
  },
  {
    id: 'valid-parentheses',
    number: 20,
    title: 'Valid Parentheses (Parênteses Válidos)',
    difficulty: 'Fácil',
    tags: ['Pilha (Stack)', 'String', 'LeetCode #20'],
    description: `Dada uma string <code>s</code> contendo apenas <code>'('</code>, <code>')'</code>, <code>'{'</code>, <code>'}'</code>, <code>'['</code> e <code>']'</code>, determine se a string de entrada é válida.
    <br><br>
    Parênteses abertos devem ser fechados pelo mesmo tipo e na ordem correta.`,
    defaultCode: `function isValid(s) {
  const stack = [];
  const map = {
    ')': '(',
    '}': '{',
    ']': '['
  };
  
  for (let i = 0; i < s.length; i++) {
    const char = s[i];
    
    if (char === '(' || char === '{' || char === '[') {
      stack.push(char);
    } else {
      const top = stack.pop();
      if (top !== map[char]) {
        return false;
      }
    }
  }
  
  return stack.length === 0;
}

isValid("()[]{}");`,
    testCases: [
      { id: 1, name: 'Exemplo 1 ("()[]{}")', args: ["()[]{}"], expected: true },
      { id: 2, name: 'Exemplo 2 ("(]")', args: ["(]"], expected: false },
      { id: 3, name: 'Exemplo 3 ("([{}])")', args: ["([{}])"], expected: true }
    ]
  },
  {
    id: 'maximum-subarray',
    number: 53,
    title: 'Maximum Subarray (Algoritmo de Kadane)',
    difficulty: 'Médio',
    tags: ['Array', 'Programação Dinâmica', 'LeetCode #53'],
    description: `Dado um array de inteiros <code>nums</code>, encontre o subarray contíguo (contendo pelo menos um número) que tenha a maior soma e retorne a sua soma.`,
    defaultCode: `function maxSubArray(nums) {
  let maxSum = nums[0];
  let currentSum = nums[0];
  
  for (let i = 1; i < nums.length; i++) {
    // Escolhe se continua acumulando ou reinicia a partir de nums[i]
    currentSum = Math.max(nums[i], currentSum + nums[i]);
    maxSum = Math.max(maxSum, currentSum);
  }
  
  return maxSum;
}

maxSubArray([-2, 1, -3, 4, -1, 2, 1, -5, 4]);`,
    testCases: [
      { id: 1, name: 'Exemplo 1', args: [[-2, 1, -3, 4, -1, 2, 1, -5, 4]], expected: 6 },
      { id: 2, name: 'Exemplo 2', args: [[1]], expected: 1 },
      { id: 3, name: 'Exemplo 3', args: [[5, 4, -1, 7, 8]], expected: 23 }
    ]
  },
  {
    id: 'move-zeroes',
    number: 283,
    title: 'Move Zeroes (Mover Zeros)',
    difficulty: 'Fácil',
    tags: ['Array', 'Dois Ponteiros', 'LeetCode #283'],
    description: `Dado um array <code>nums</code>, mova todos os zeros para o final, mantendo a ordem relativa dos elementos não-zero.
    <br><br>
    Faça isso in-place sem criar uma cópia do array.`,
    defaultCode: `function moveZeroes(nums) {
  let insertPos = 0;
  
  // Primeiro passa colocando todos os números diferentes de zero
  for (let i = 0; i < nums.length; i++) {
    if (nums[i] !== 0) {
      const temp = nums[insertPos];
      nums[insertPos] = nums[i];
      nums[i] = temp;
      insertPos++;
    }
  }
  
  return nums;
}

moveZeroes([0, 1, 0, 3, 12]);`,
    testCases: [
      { id: 1, name: 'Exemplo 1 ([0,1,0,3,12])', args: [[0, 1, 0, 3, 12]], expected: [1, 3, 12, 0, 0] },
      { id: 2, name: 'Exemplo 2 ([0])', args: [[0]], expected: [0] }
    ]
  },
  {
    id: 'custom-playground',
    number: 0,
    title: 'Playground Livre (Seu Código JS)',
    difficulty: 'Livre',
    tags: ['JavaScript', 'Treino', 'Personalizado'],
    description: `Escreva qualquer algoritmo ou código JavaScript. Veja em tempo real as variáveis mudando, os ponteiros se movendo nos arrays e o fluxo de execução passo a passo!`,
    defaultCode: `// Digite seu código aqui para treinar!
function test(arr) {
  let count = 0;
  for (let i = 0; i < arr.length; i++) {
    count += arr[i];
    console.log("Soma parcial no índice " + i + ":", count);
  }
  return count;
}

test([10, 20, 30, 40]);`,
    testCases: [
      { id: 1, name: 'Teste Livre 1', args: [[10, 20, 30, 40]], expected: 100 }
    ]
  }
];
