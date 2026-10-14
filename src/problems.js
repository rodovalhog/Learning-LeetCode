export const PROBLEMS = [
  // ==========================================
  // JANELA DESLIZANTE (SLIDING WINDOW)
  // ==========================================
  {
    id: 'sliding-window-max-average',
    category: 'Janela Deslizante (Sliding Window)',
    number: 643,
    title: 'Maximum Average Subarray I (Janela Fixa K)',
    difficulty: 'Fácil',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
    tags: ['Sliding Window', 'Array', 'LeetCode #643'],
    description: `Dado um array de inteiros <code>nums</code> consistindo de <code>n</code> elementos e um inteiro <code>k</code>, encontre um subarray contíguo cujo comprimento seja igual a <code>k</code> que tenha o <strong>maior valor médio</strong> e retorne esse valor.
    <br><br>
    <strong>Técnica de Janela Fixa:</strong> Calcula a soma dos primeiros <code>k</code> elementos. Em seguida, desliza a janela adicionando o elemento que entra na direita e subtraindo o que sai pela esquerda em <code>O(1)</code> a cada passo.`,
    defaultCode: `function findMaxAverage(nums, k) {
  let windowSum = 0;
  
  // 1. Calcula a soma da primeira janela de tamanho k
  for (let i = 0; i < k; i++) {
    windowSum += nums[i];
  }
  
  let maxSum = windowSum;
  
  // 2. Desliza a janela adicionando nums[i] e removendo nums[i - k]
  for (let i = k; i < nums.length; i++) {
    windowSum += nums[i] - nums[i - k];
    maxSum = Math.max(maxSum, windowSum);
  }
  
  return Number((maxSum / k).toFixed(5));
}

findMaxAverage([1, 12, -5, -6, 50, 3], 4);`,
    testCases: [
      { id: 1, name: 'Exemplo 1 ([1, 12, -5, -6, 50, 3], k=4)', args: [[1, 12, -5, -6, 50, 3], 4], expected: 12.75 },
      { id: 2, name: 'Exemplo 2 ([5], k=1)', args: [[5], 1], expected: 5 },
      { id: 3, name: 'Exemplo 3 ([0, 4, 0, 3, 2], k=1)', args: [[0, 4, 0, 3, 2], 1], expected: 4 }
    ]
  },
  {
    id: 'longest-substring-without-repeating',
    category: 'Janela Deslizante (Sliding Window)',
    number: 3,
    title: 'Longest Substring Without Repeating (Janela Dinâmica)',
    difficulty: 'Médio',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(n)',
    tags: ['Sliding Window', 'Set', 'Strings', 'LeetCode #3'],
    description: `Dada uma string <code>s</code>, encontre o comprimento da <strong>substring mais longa</strong> sem caracteres repetidos.
    <br><br>
    <strong>Técnica de Janela Dinâmica:</strong> Usamos um <code>Set</code> e dois ponteiros (<code>left</code> e <code>right</code>). Expandimos <code>right</code> adicionando caracteres. Se encontrarmos um caractere duplicado, contraímos <code>left</code> até remover a duplicata.`,
    defaultCode: `function lengthOfLongestSubstring(s) {
  const seen = new Set();
  let left = 0;
  let maxLength = 0;
  
  for (let right = 0; right < s.length; right++) {
    // Se o caractere já está na janela, encolhe pela esquerda
    while (seen.has(s[right])) {
      seen.delete(s[left]);
      left++;
    }
    
    // Adiciona caractere novo na janela e atualiza maior tamanho
    seen.add(s[right]);
    maxLength = Math.max(maxLength, right - left + 1);
  }
  
  return maxLength;
}

lengthOfLongestSubstring("abcabcbb");`,
    testCases: [
      { id: 1, name: 'Exemplo 1 ("abcabcbb")', args: ["abcabcbb"], expected: 3 },
      { id: 2, name: 'Exemplo 2 ("bbbbb")', args: ["bbbbb"], expected: 1 },
      { id: 3, name: 'Exemplo 3 ("pwwkew")', args: ["pwwkew"], expected: 3 }
    ]
  },
  {
    id: 'min-size-subarray-sum',
    category: 'Janela Deslizante (Sliding Window)',
    number: 209,
    title: 'Minimum Size Subarray Sum (Janela Encolhível)',
    difficulty: 'Médio',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
    tags: ['Sliding Window', 'Array', 'LeetCode #209'],
    description: `Dado um array de inteiros positivos <code>nums</code> e um inteiro positivo <code>target</code>, retorne o <strong>comprimento mínimo</strong> de um subarray contíguo cuja soma seja maior ou igual a <code>target</code>. Se não houver, retorne <code>0</code>.
    <br><br>
    <strong>Técnica:</strong> Expande a janela com <code>right</code> acumulando a soma. Assim que a soma atinge <code>target</code>, registra o tamanho e tenta encolher com <code>left</code> para achar janelas ainda menores.`,
    defaultCode: `function minSubArrayLen(target, nums) {
  let minLen = Infinity;
  let windowSum = 0;
  let left = 0;
  
  for (let right = 0; right < nums.length; right++) {
    windowSum += nums[right];
    
    // Enquanto a janela alcançar o target, registra o tamanho e encolhe
    while (windowSum >= target) {
      minLen = Math.min(minLen, right - left + 1);
      windowSum -= nums[left];
      left++;
    }
  }
  
  return minLen === Infinity ? 0 : minLen;
}

minSubArrayLen(7, [2, 3, 1, 2, 4, 3]);`,
    testCases: [
      { id: 1, name: 'Exemplo 1 (target=7, [2,3,1,2,4,3])', args: [7, [2, 3, 1, 2, 4, 3]], expected: 2 },
      { id: 2, name: 'Exemplo 2 (target=4, [1,4,4])', args: [4, [1, 4, 4]], expected: 1 },
      { id: 3, name: 'Exemplo 3 (target=11, [1,1,1,1...])', args: [11, [1, 1, 1, 1, 1, 1, 1, 1]], expected: 0 }
    ]
  },

  // ==========================================
  // DOIS PONTEIROS (TWO POINTERS)
  // ==========================================
  {
    id: 'two-sum-sorted',
    category: 'Dois Ponteiros (Two Pointers)',
    number: 167,
    title: 'Two Sum II - Input Array Is Sorted (Ponteiros Convergentes)',
    difficulty: 'Médio',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
    tags: ['Dois Ponteiros', 'Array Ordenado', 'LeetCode #167'],
    description: `Dado um array de inteiros <code>numbers</code> ordenado em ordem não-decrescente, encontre dois números cuja soma seja igual a <code>target</code>.
    <br><br>
    Retorne os <strong>índices 1-based</strong> <code>[index1, index2]</code>. Com o array ordenado, se a soma for menor que o alvo, avançamos o ponteiro da esquerda; se for maior, recuamos o da direita.`,
    defaultCode: `function twoSumSorted(numbers, target) {
  let left = 0;
  let right = numbers.length - 1;
  
  while (left < right) {
    const sum = numbers[left] + numbers[right];
    
    if (sum === target) {
      return [left + 1, right + 1]; // Resposta com índices 1-based
    } else if (sum < target) {
      left++; // Soma muito baixa: avança esquerda para aumentar
    } else {
      right--; // Soma muito alta: recua direita para diminuir
    }
  }
  
  return [];
}

twoSumSorted([2, 7, 11, 15], 9);`,
    testCases: [
      { id: 1, name: 'Exemplo 1 ([2,7,11,15], target=9)', args: [[2, 7, 11, 15], 9], expected: [1, 2] },
      { id: 2, name: 'Exemplo 2 ([2,3,4], target=6)', args: [[2, 3, 4], 6], expected: [1, 3] },
      { id: 3, name: 'Exemplo 3 ([-1,0], target=-1)', args: [[-1, 0], -1], expected: [1, 2] }
    ]
  },
  {
    id: 'container-with-most-water',
    category: 'Dois Ponteiros (Two Pointers)',
    number: 11,
    title: 'Container With Most Water (Maior Recipiente de Água)',
    difficulty: 'Médio',
    tags: ['Dois Ponteiros', 'Otimização Gulosa', 'LeetCode #11'],
    description: `Você recebe um array de inteiros <code>height</code> de comprimento <code>n</code>. Há <code>n</code> linhas verticais. Encontre duas linhas que, junto com o eixo x, formem um recipiente que contenha a <strong>maior quantidade de água</strong>.
    <br><br>
    A área é limitada pela menor das duas alturas (<code>Math.min(h[l], h[r]) * (r - l)</code>). Movemos sempre o ponteiro da linha menor buscando encontrar uma barreira mais alta.`,
    defaultCode: `function maxArea(height) {
  let left = 0;
  let right = height.length - 1;
  let maxWater = 0;
  
  while (left < right) {
    const width = right - left;
    const h = Math.min(height[left], height[right]);
    const area = width * h;
    
    maxWater = Math.max(maxWater, area);
    
    // A barra mais baixa é o gargalo limitador; avançamos ela
    if (height[left] < height[right]) {
      left++;
    } else {
      right--;
    }
  }
  
  return maxWater;
}

maxArea([1, 8, 6, 2, 5, 4, 8, 3, 7]);`,
    testCases: [
      { id: 1, name: 'Exemplo 1 ([1,8,6,2,5,4,8,3,7])', args: [[1, 8, 6, 2, 5, 4, 8, 3, 7]], expected: 49 },
      { id: 2, name: 'Exemplo 2 ([1,1])', args: [[1, 1]], expected: 1 }
    ]
  },
  {
    id: 'remove-duplicates-sorted',
    category: 'Dois Ponteiros (Two Pointers)',
    number: 26,
    title: 'Remove Duplicates from Sorted Array (Fast & Slow Pointers)',
    difficulty: 'Fácil',
    tags: ['Dois Ponteiros', 'Array In-Place', 'LeetCode #26'],
    description: `Dado um array ordenado <code>nums</code>, remova as duplicatas <strong>in-place</strong> de modo que cada elemento único apareça apenas uma vez. Retorne a quantidade de elementos únicos <code>k</code>.
    <br><br>
    O ponteiro lento <code>slow</code> marca o índice do último elemento único confirmado, enquanto <code>fast</code> percorre o array explorando novos valores.`,
    defaultCode: `function removeDuplicates(nums) {
  if (nums.length === 0) return 0;
  
  let slow = 0;
  
  for (let fast = 1; fast < nums.length; fast++) {
    // Quando fast acha um elemento diferente do último único em slow
    if (nums[fast] !== nums[slow]) {
      slow++;
      nums[slow] = nums[fast];
    }
  }
  
  return slow + 1;
}

removeDuplicates([0, 0, 1, 1, 1, 2, 2, 3, 3, 4]);`,
    testCases: [
      { id: 1, name: 'Exemplo 1 ([1, 1, 2])', args: [[1, 1, 2]], expected: 2 },
      { id: 2, name: 'Exemplo 2 ([0,0,1,1,1,2,2,3,3,4])', args: [[0, 0, 1, 1, 1, 2, 2, 3, 3, 4]], expected: 5 }
    ]
  },
  {
    id: 'reverse-string',
    category: 'Dois Ponteiros (Two Pointers)',
    number: 344,
    title: 'Reverse String (Inverter Array de Caracteres)',
    difficulty: 'Fácil',
    tags: ['Dois Ponteiros', 'Array In-Place', 'LeetCode #344'],
    description: `Escreva uma função que inverte uma string recebida como array de caracteres <code>s</code>.
    <br><br>
    A inversão deve ser feita <strong>in-place</strong> com complexidade de memória <code>O(1)</code> utilizando dois ponteiros (<code>left</code> e <code>right</code>) trocando elementos das extremidades.`,
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
    category: 'Dois Ponteiros (Two Pointers)',
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
    id: 'move-zeroes',
    category: 'Dois Ponteiros (Two Pointers)',
    number: 283,
    title: 'Move Zeroes (Mover Zeros)',
    difficulty: 'Fácil',
    tags: ['Array', 'Dois Ponteiros', 'LeetCode #283'],
    description: `Dado um array <code>nums</code>, mova todos os zeros para o final mantendo a ordem relativa dos elementos não-zero. Faça isso <strong>in-place</strong> sem criar uma cópia do array.`,
    defaultCode: `function moveZeroes(nums) {
  let insertPos = 0;
  
  // Coloca todos os números diferentes de zero na frente
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
    id: 'merge-sorted-array',
    category: 'Dois Ponteiros (Two Pointers)',
    number: 88,
    title: 'Merge Sorted Array (Três Ponteiros In-Place)',
    difficulty: 'Fácil',
    tags: ['Dois Ponteiros', 'Array In-Place', 'LeetCode #88'],
    description: `Você recebe dois arrays de inteiros ordenados <code>nums1</code> e <code>nums2</code>. Mescle <code>nums2</code> dentro de <code>nums1</code> como um único array ordenado.
    <br><br>
    <strong>Truque de Trás para Frente:</strong> Preenchemos <code>nums1</code> do fim para o começo usando <code>p1</code>, <code>p2</code> e <code>p</code>. Isso garante que nunca sobrescreveremos elementos não lidos de <code>nums1</code>!`,
    defaultCode: `function merge(nums1, m, nums2, n) {
  let p1 = m - 1;
  let p2 = n - 1;
  let p = m + n - 1;
  
  // Preenche de trás para a frente
  while (p2 >= 0) {
    if (p1 >= 0 && nums1[p1] > nums2[p2]) {
      nums1[p] = nums1[p1];
      p1--;
    } else {
      nums1[p] = nums2[p2];
      p2--;
    }
    p--;
  }
  
  return nums1;
}

merge([1, 2, 3, 0, 0, 0], 3, [2, 5, 6], 3);`,
    testCases: [
      { id: 1, name: 'Exemplo 1 ([1,2,3,0,0,0], [2,5,6])', args: [[1, 2, 3, 0, 0, 0], 3, [2, 5, 6], 3], expected: [1, 2, 2, 3, 5, 6] },
      { id: 2, name: 'Exemplo 2 ([1], 1, [], 0)', args: [[1], 1, [], 0], expected: [1] }
    ]
  },

  // ==========================================
  // TABELAS HASH & CONJUNTOS (HASH MAP & SET)
  // ==========================================
  {
    id: 'two-sum',
    category: 'Tabelas Hash & Conjuntos',
    number: 1,
    title: 'Two Sum (Soma de Dois com Hash Map)',
    difficulty: 'Fácil',
    tags: ['Array', 'Hash Map', 'LeetCode #1'],
    description: `Dado um array de inteiros <code>nums</code> e um inteiro <code>target</code>, retorne os <strong>índices dos dois números</strong> cuja soma seja igual a <code>target</code>.
    <br><br>
    Usamos um <code>Map</code> para registrar cada elemento já visitado e seu índice. Em cada iteração, verificamos se a diferença <code>target - nums[i]</code> já existe no Map em tempo <code>O(1)</code>.`,
    defaultCode: `function twoSum(nums, target) {
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

twoSum([2, 7, 11, 15], 9);`,
    testCases: [
      { id: 1, name: 'Exemplo 1 ([2,7,11,15], target=9)', args: [[2, 7, 11, 15], 9], expected: [0, 1] },
      { id: 2, name: 'Exemplo 2 ([3,2,4], target=6)', args: [[3, 2, 4], 6], expected: [1, 2] },
      { id: 3, name: 'Exemplo 3 ([3,3], target=6)', args: [[3, 3], 6], expected: [0, 1] }
    ]
  },
  {
    id: 'valid-anagram',
    category: 'Tabelas Hash & Conjuntos',
    number: 242,
    title: 'Valid Anagram (Contagem de Frequência com Map)',
    difficulty: 'Fácil',
    tags: ['Hash Map', 'Strings', 'LeetCode #242'],
    description: `Dadas duas strings <code>s</code> e <code>t</code>, retorne <code>true</code> se <code>t</code> for um <strong>anagrama</strong> de <code>s</code>, e <code>false</code> caso contrário.
    <br><br>
    Contabilizamos a frequência de cada caractere de <code>s</code> em um <code>Map</code> e depois decrementamos as ocorrências percorrendo <code>t</code>.`,
    defaultCode: `function isAnagram(s, t) {
  if (s.length !== t.length) return false;
  
  const freq = new Map();
  
  // Contabiliza frequências da primeira string
  for (let i = 0; i < s.length; i++) {
    const char = s[i];
    freq.set(char, (freq.get(char) || 0) + 1);
  }
  
  // Subtrai frequências usando a segunda string
  for (let i = 0; i < t.length; i++) {
    const char = t[i];
    if (!freq.has(char) || freq.get(char) === 0) {
      return false;
    }
    freq.set(char, freq.get(char) - 1);
  }
  
  return true;
}

isAnagram("anagram", "nagaram");`,
    testCases: [
      { id: 1, name: 'Exemplo 1 ("anagram", "nagaram")', args: ["anagram", "nagaram"], expected: true },
      { id: 2, name: 'Exemplo 2 ("rat", "car")', args: ["rat", "car"], expected: false }
    ]
  },
  {
    id: 'contains-duplicate',
    category: 'Tabelas Hash & Conjuntos',
    number: 217,
    title: 'Contains Duplicate (Detecção com Hash Set)',
    difficulty: 'Fácil',
    tags: ['Set', 'Array', 'LeetCode #217'],
    description: `Dado um array de inteiros <code>nums</code>, retorne <code>true</code> se qualquer valor aparecer <strong>pelo menos duas vezes</strong> no array, e retorne <code>false</code> se cada elemento for distinto.`,
    defaultCode: `function containsDuplicate(nums) {
  const seen = new Set();
  
  for (let i = 0; i < nums.length; i++) {
    if (seen.has(nums[i])) {
      return true; // Encontrou duplicata imediatamente!
    }
    seen.add(nums[i]);
  }
  
  return false;
}

containsDuplicate([1, 2, 3, 1]);`,
    testCases: [
      { id: 1, name: 'Exemplo 1 ([1, 2, 3, 1])', args: [[1, 2, 3, 1]], expected: true },
      { id: 2, name: 'Exemplo 2 ([1, 2, 3, 4])', args: [[1, 2, 3, 4]], expected: false },
      { id: 3, name: 'Exemplo 3 ([1, 1, 1, 3, 3, 4...])', args: [[1, 1, 1, 3, 3, 4, 3, 2, 4, 2]], expected: true }
    ]
  },
  {
    id: 'first-unique-character',
    category: 'Tabelas Hash & Conjuntos',
    number: 387,
    title: 'First Unique Character in a String (Primeiro Caractere Único)',
    difficulty: 'Fácil',
    tags: ['Hash Map', 'Strings', 'LeetCode #387'],
    description: `Dada uma string <code>s</code>, encontre o <strong>primeiro caractere não repetido</strong> e retorne o seu índice. Se ele não existir, retorne <code>-1</code>.
    <br><br>
    Fazemos uma primeira passada para contar as ocorrências de cada letra no <code>Map</code> e uma segunda passada para encontrar o primeiro caractere com contagem igual a <code>1</code>.`,
    defaultCode: `function firstUniqChar(s) {
  const count = new Map();
  
  // 1ª passada: contabiliza frequência
  for (let i = 0; i < s.length; i++) {
    const char = s[i];
    count.set(char, (count.get(char) || 0) + 1);
  }
  
  // 2ª passada: encontra o primeiro caractere com contagem 1
  for (let i = 0; i < s.length; i++) {
    if (count.get(s[i]) === 1) {
      return i;
    }
  }
  
  return -1;
}

firstUniqChar("leetcode");`,
    testCases: [
      { id: 1, name: 'Exemplo 1 ("leetcode")', args: ["leetcode"], expected: 0 },
      { id: 2, name: 'Exemplo 2 ("loveleetcode")', args: ["loveleetcode"], expected: 2 },
      { id: 3, name: 'Exemplo 3 ("aabb")', args: ["aabb"], expected: -1 }
    ]
  },

  // ==========================================
  // PILHAS & ESTRUTURAS LINEARES (STACK)
  // ==========================================
  {
    id: 'valid-parentheses',
    category: 'Pilhas & Estruturas Lineares',
    number: 20,
    title: 'Valid Parentheses (Parênteses Válidos)',
    difficulty: 'Fácil',
    tags: ['Pilha (Stack)', 'String', 'LeetCode #20'],
    description: `Dada uma string <code>s</code> contendo apenas <code>'('</code>, <code>')'</code>, <code>'{'</code>, <code>'}'</code>, <code>'['</code> e <code>']'</code>, determine se a string de entrada é válida.
    <br><br>
    Parênteses abertos devem ser fechados pelo mesmo tipo e na ordem correta usando a regra <strong>LIFO (Last-In First-Out)</strong> de uma pilha.`,
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
    id: 'remove-adjacent-duplicates',
    category: 'Pilhas & Estruturas Lineares',
    number: 1047,
    title: 'Remove All Adjacent Duplicates (Remover Duplicatas com Pilha)',
    difficulty: 'Fácil',
    tags: ['Pilha (Stack)', 'Strings', 'LeetCode #1047'],
    description: `Você recebe uma string <code>s</code>. Uma remoção de duplicatas adjacentes consiste em escolher dois caracteres adjacentes iguais e removê-los.
    <br><br>
    Repetimos as remoções até não ser mais possível. Usamos uma <strong>Pilha</strong>: se o caractere atual for igual ao do topo da pilha, desempilhamos; senão, empilhamos.`,
    defaultCode: `function removeDuplicatesString(s) {
  const stack = [];
  
  for (let i = 0; i < s.length; i++) {
    const char = s[i];
    
    // Se o caractere for igual ao do topo da pilha, elimina o par adjacente
    if (stack.length > 0 && stack[stack.length - 1] === char) {
      stack.pop();
    } else {
      stack.push(char);
    }
  }
  
  return stack.join('');
}

removeDuplicatesString("abbaca");`,
    testCases: [
      { id: 1, name: 'Exemplo 1 ("abbaca")', args: ["abbaca"], expected: "ca" },
      { id: 2, name: 'Exemplo 2 ("azxxzy")', args: ["azxxzy"], expected: "ay" }
    ]
  },

  // ==========================================
  // BUSCA BINÁRIA (BINARY SEARCH)
  // ==========================================
  {
    id: 'binary-search',
    category: 'Busca Binária',
    number: 704,
    title: 'Binary Search (Busca Binária Clássica)',
    difficulty: 'Fácil',
    tags: ['Busca Binária', 'Array', 'LeetCode #704'],
    description: `Dado um array ordenado de inteiros <code>nums</code> e um número <code>target</code>, escreva uma função para buscar <code>target</code> em <code>nums</code>.
    <br><br>
    Se o elemento existir, retorne seu índice. Caso contrário, retorne <code>-1</code>. O algoritmo divide o espaço de busca pela metade a cada passo rodando em tempo <code>O(log n)</code>.`,
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
    id: 'search-insert-position',
    category: 'Busca Binária',
    number: 35,
    title: 'Search Insert Position (Posição de Inserção Binária)',
    difficulty: 'Fácil',
    tags: ['Busca Binária', 'Array', 'LeetCode #35'],
    description: `Dado um array ordenado de inteiros distintos <code>nums</code> e um valor <code>target</code>, retorne o índice se o alvo for encontrado. Se não, retorne o índice onde ele seria inserido em ordem.
    <br><br>
    Se o loop terminar sem encontrar o elemento, o ponteiro <code>low</code> aponta exatamente para a posição correta de inserção!`,
    defaultCode: `function searchInsert(nums, target) {
  let low = 0;
  let high = nums.length - 1;
  
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    
    if (nums[mid] === target) {
      return mid;
    } else if (nums[mid] < target) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  
  // Ao término do loop, low é a posição correta de inserção
  return low;
}

searchInsert([1, 3, 5, 6], 5);`,
    testCases: [
      { id: 1, name: 'Exemplo 1 ([1,3,5,6], target=5)', args: [[1, 3, 5, 6], 5], expected: 2 },
      { id: 2, name: 'Exemplo 2 ([1,3,5,6], target=2)', args: [[1, 3, 5, 6], 2], expected: 1 },
      { id: 3, name: 'Exemplo 3 ([1,3,5,6], target=7)', args: [[1, 3, 5, 6], 7], expected: 4 }
    ]
  },

  // ==========================================
  // PROGRAMAÇÃO DINÂMICA & GULOSA (DP & GREEDY)
  // ==========================================
  {
    id: 'maximum-subarray',
    category: 'Programação Dinâmica & Gulosa',
    number: 53,
    title: 'Maximum Subarray (Algoritmo de Kadane)',
    difficulty: 'Médio',
    tags: ['Array', 'Programação Dinâmica', 'LeetCode #53'],
    description: `Dado um array de inteiros <code>nums</code>, encontre o subarray contíguo (contendo pelo menos um número) que tenha a <strong>maior soma</strong> e retorne a sua soma.
    <br><br>
    O algoritmo de Kadane decide a cada passo se compensa estender a soma acumulada anterior ou recomeçar um novo subarray a partir do elemento atual.`,
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
    id: 'best-time-to-buy-and-sell-stock',
    category: 'Programação Dinâmica & Gulosa',
    number: 121,
    title: 'Best Time to Buy and Sell Stock (Melhor Momento para Vender)',
    difficulty: 'Fácil',
    tags: ['Gulosa / DP', 'Array', 'LeetCode #121'],
    description: `Você recebe um array <code>prices</code> onde <code>prices[i]</code> é o preço de uma determinada ação no <code>i</code>-ésimo dia.
    <br><br>
    Você quer maximizar seu lucro escolhendo um único dia para comprar uma ação e escolhendo um dia diferente no futuro para vendê-la. Retorne o <strong>lucro máximo</strong> que você pode obter.`,
    defaultCode: `function maxProfit(prices) {
  let minPrice = Infinity;
  let maxProfit = 0;
  
  for (let i = 0; i < prices.length; i++) {
    const price = prices[i];
    
    if (price < minPrice) {
      minPrice = price; // Novo menor preço de compra encontrado
    } else if (price - minPrice > maxProfit) {
      maxProfit = price - minPrice; // Novo lucro recorde
    }
  }
  
  return maxProfit;
}

maxProfit([7, 1, 5, 3, 6, 4]);`,
    testCases: [
      { id: 1, name: 'Exemplo 1 ([7, 1, 5, 3, 6, 4])', args: [[7, 1, 5, 3, 6, 4]], expected: 5 },
      { id: 2, name: 'Exemplo 2 ([7, 6, 4, 3, 1])', args: [[7, 6, 4, 3, 1]], expected: 0 }
    ]
  },

  // ==========================================
  // LISTAS ENCADEADAS (LINKED LISTS)
  // ==========================================
  {
    id: 'reverse-linked-list',
    category: 'Listas Encadeadas (Linked Lists)',
    number: 206,
    title: 'Reverse Linked List (Inverter Lista)',
    difficulty: 'Fácil',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
    tags: ['Linked List', 'Ponteiros In-Place', 'LeetCode #206'],
    description: `Dada a cabeça de uma lista encadeada simples, inverta a ordem de todos os nós <strong>in-place</strong> e retorne a nova cabeça.
    <br><br>
    <strong>Técnica de 3 Ponteiros:</strong> Mantemos <code>prev</code> (inicia em null), <code>curr</code> (o nó atual) e <code>nextTemp</code> (para salvar a referência do próximo nó antes de inverter a seta <code>curr.next = prev</code>).
    <br>
    Complexidade Alvo: <strong>Tempo O(n)</strong> | <strong>Espaço O(1)</strong>.`,
    defaultCode: `function reverseList(head) {
  let prev = null;
  let curr = head;

  while (curr !== null) {
    const nextTemp = curr.next; // Salva o próximo nó
    curr.next = prev;          // Inverte o ponteiro para trás
    prev = curr;               // Move prev para a frente
    curr = nextTemp;           // Move curr para a frente
  }

  return prev;
}

// Lista: 1 -> 2 -> 3 -> 4 -> 5 -> null
const list = {
  val: 1,
  next: {
    val: 2,
    next: {
      val: 3,
      next: {
        val: 4,
        next: { val: 5, next: null }
      }
    }
  }
};

reverseList(list);`,
    testCases: [
      {
        id: 1,
        name: 'Exemplo 1 (1 -> 2 -> 3)',
        args: [{ val: 1, next: { val: 2, next: { val: 3, next: null } } }],
        expected: { val: 3, next: { val: 2, next: { val: 1, next: null } } }
      },
      {
        id: 2,
        name: 'Exemplo 2 (1 -> 2)',
        args: [{ val: 1, next: { val: 2, next: null } }],
        expected: { val: 2, next: { val: 1, next: null } }
      }
    ]
  },
  {
    id: 'middle-of-linked-list',
    category: 'Listas Encadeadas (Linked Lists)',
    number: 876,
    title: 'Middle of the Linked List (Nó Central)',
    difficulty: 'Fácil',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
    tags: ['Linked List', 'Fast & Slow', 'LeetCode #876'],
    description: `Dada a cabeça de uma lista encadeada, retorne o <strong>nó do meio</strong> em uma única passagem (one-pass). Se o número de nós for par, retorne o segundo nó do meio.
    <br><br>
    <strong>Técnica de Dois Ponteiros (Tortoise & Hare):</strong> <code>slow</code> avança 1 nó por iteração enquanto <code>fast</code> avança 2 nós. Quando <code>fast</code> chega ao final, <code>slow</code> estará exatamente no centro.`,
    defaultCode: `function middleNode(head) {
  let slow = head;
  let fast = head;

  // Enquanto a Lebre (fast) puder dar 2 passos
  while (fast !== null && fast.next !== null) {
    slow = slow.next;      // Tartaruga dá 1 passo
    fast = fast.next.next; // Lebre dá 2 passos
  }

  return slow;
}

// Lista: 1 -> 2 -> 3 -> 4 -> 5 -> null (Meio: 3)
const list = {
  val: 1,
  next: {
    val: 2,
    next: {
      val: 3,
      next: {
        val: 4,
        next: { val: 5, next: null }
      }
    }
  }
};

middleNode(list);`,
    testCases: [
      {
        id: 1,
        name: 'Ímpar [1, 2, 3, 4, 5]',
        args: [{ val: 1, next: { val: 2, next: { val: 3, next: { val: 4, next: { val: 5, next: null } } } } }],
        expected: { val: 3, next: { val: 4, next: { val: 5, next: null } } }
      }
    ]
  },
  {
    id: 'linked-list-cycle',
    category: 'Listas Encadeadas (Linked Lists)',
    number: 141,
    title: 'Linked List Cycle (Detecção de Ciclo)',
    difficulty: 'Fácil',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
    tags: ['Linked List', 'Floyd Cycle', 'LeetCode #141'],
    description: `Determine se uma lista encadeada possui um <strong>ciclo</strong> (se algum nó aponta de volta para um nó anterior na cadeia).
    <br><br>
    <strong>Algoritmo de Floyd:</strong> Em vez de gastar O(n) de memória com um Set, colocamos um ponteiro lento (1 passo) e um rápido (2 passos). Se houver ciclo, a lebre inevitavelmente alcança a tartaruga em tempo O(n).`,
    defaultCode: `function hasCycle(head) {
  let slow = head;
  let fast = head;

  while (fast !== null && fast.next !== null) {
    slow = slow.next;         // Anda 1 passo
    fast = fast.next.next;    // Anda 2 passos

    if (slow === fast) {
      return true; // Encontraram-se! Há ciclo na lista
    }
  }

  return false; // Chegou a null -> Sem ciclo
}

// Cria nós encadeados com ciclo circular:
const n1 = { val: 3, next: null };
const n2 = { val: 2, next: null };
const n3 = { val: 0, next: null };
const n4 = { val: -4, next: null };

n1.next = n2;
n2.next = n3;
n3.next = n4;
n4.next = n2; // Aponta de volta para n2 formando um ciclo!

hasCycle(n1);`,
    testCases: [
      {
        id: 1,
        name: 'Sem ciclo [1 -> 2 -> null]',
        args: [{ val: 1, next: { val: 2, next: null } }],
        expected: false
      }
    ]
  },
  {
    id: 'merge-two-sorted-lists',
    category: 'Listas Encadeadas (Linked Lists)',
    number: 21,
    title: 'Merge Two Sorted Lists (Mesclar Listas)',
    difficulty: 'Fácil',
    timeComplexity: 'O(n + m)',
    spaceComplexity: 'O(1)',
    tags: ['Linked List', 'Dummy Head', 'LeetCode #21'],
    description: `Dadas duas listas encadeadas ordenadas, mescle-as em uma única lista ordenada e retorne sua cabeça.
    <br><br>
    <strong>Técnica do Dummy Node:</strong> Usamos um nó sentinela <code>dummy = { val: -1, next: null }</code> para construir a nova lista conectando diretamente os nós existentes sem alocar nova memória.`,
    defaultCode: `function mergeTwoLists(list1, list2) {
  const dummy = { val: -1, next: null };
  let current = dummy;

  while (list1 !== null && list2 !== null) {
    if (list1.val <= list2.val) {
      current.next = list1;
      list1 = list1.next;
    } else {
      current.next = list2;
      list2 = list2.next;
    }
    current = current.next;
  }

  // Conecta os nós restantes da lista que sobrou
  current.next = list1 !== null ? list1 : list2;

  return dummy.next;
}

const l1 = { val: 1, next: { val: 2, next: { val: 4, next: null } } };
const l2 = { val: 1, next: { val: 3, next: { val: 4, next: null } } };

mergeTwoLists(l1, l2);`,
    testCases: [
      {
        id: 1,
        name: 'Exemplo [1, 2] e [3, 4]',
        args: [
          { val: 1, next: { val: 2, next: null } },
          { val: 3, next: { val: 4, next: null } }
        ],
        expected: { val: 1, next: { val: 2, next: { val: 3, next: { val: 4, next: null } } } }
      }
    ]
  },

  // ==========================================
  // PLAYGROUND LIVRE
  // ==========================================
  {
    id: 'custom-playground',
    category: 'Playground Livre',
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
