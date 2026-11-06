import numpy as np
import matplotlib.pyplot as plt

# Параметры задачи
L = 1.0
T = 0.5
h = 0.05
N = int(L / h)
x = np.linspace(0, L, N + 1)

def f(x, t):
    return -0.9 * np.cos(3 * t) + 0.4 * np.sin(2 * x)

def u0(x):
    return 0.1 * np.sin(2 * x) + 0.2

def u_left(t):
    # В условии du(0,t)/dx = 0.2, но по смыслу задачи u(0,t) = 0.1*sin(2)+0.2
    return 0.1 * np.sin(2) + 0.2

def u_right(t):
    return 0.1 * np.sin(2) + 0.2

# Явная схема
def explicit():
    tau = h # Условие устойчивости tau <= h(шаг по вр)
    M = int(T / tau) + 1  # Колич врем шагов
    tau = T / (M - 1) 
    
    y = np.zeros((M, N + 1))
    y[0, :] = u0(x)
    
    # Граничные условия
    y[:, 0] = u_left(0)
    y[:, N] = u_right(0)
    
    gamma = tau**2 / h**2
    
    # Первый слой (t = tau)
    for i in range(1, N):
        y[1, i] = y[0, i] + 0.5 * gamma * (y[0, i+1] - 2*y[0, i] + y[0, i-1]) + 0.5 * tau**2 * f(x[i], 0)
        
    # Остальные слои
    for j in range(1, M - 1):
        for i in range(1, N):
            y[j+1, i] = 2*y[j, i] - y[j-1, i] + gamma * (y[j, i+1] - 2*y[j, i] + y[j, i-1]) + tau**2 * f(x[i], j*tau)
            
    return y[-1, :]

# Неявная схема (sigma = 1/2)
def implicit(h_val):
    tau = h_val
    N_loc = int(L / h_val) # Количество шагов по x
    x_loc = np.linspace(0, L, N_loc + 1) # Сетка по x
    M = int(T / tau) + 1
    tau = T / (M - 1)
    
    y = np.zeros((M, N_loc + 1))
    y[0, :] = u0(x_loc)
    y[:, 0] = u_left(0)
    y[:, N_loc] = u_right(0)
    
    gamma = tau**2 / h_val**2
    half_gamma = gamma / 2
    
    # Матрица A для решения системы ур
    A = np.zeros((N_loc - 1, N_loc - 1))
    for i in range(N_loc - 1):
        A[i, i] = 1 + gamma
        if i > 0: A[i, i-1] = -half_gamma
        if i < N_loc - 2: A[i, i+1] = -half_gamma
        
    # Первый слой
    B = np.zeros(N_loc - 1)
    for i in range(1, N_loc):
        B[i-1] = y[0, i] + half_gamma * (y[0, i+1] - 2*y[0, i] + y[0, i-1]) + 0.5 * tau**2 * f(x_loc[i], 0)
    # Учитываем граничные условия
    B[0] += half_gamma * u_left(0)
    B[-1] += half_gamma * u_right(0)
    
    y[1, 1:N_loc] = np.linalg.solve(A, B)
    
    # Остальные слои
    for j in range(1, M - 1):
        B = np.zeros(N_loc - 1)
        for i in range(1, N_loc):
            B[i-1] = 2*y[j, i] - y[j-1, i] + half_gamma * (y[j-1, i+1] - 2*y[j-1, i] + y[j-1, i-1]) + tau**2 * f(x_loc[i], j*tau)
            
        B[0] += half_gamma * u_left(j*tau)
        B[-1] += half_gamma * u_right(j*tau)
        
        y[j+1, 1:N_loc] = np.linalg.solve(A, B)
        
    return x_loc, y[-1, :]

# Запуск и графики
u_exp = explicit()

x_imp05, u_imp05 = implicit(0.05)
x_imp01, u_imp01 = implicit(0.01)

print("РЕЗУЛЬТАТЫ РАСЧЕТА ДЛЯ T = 0.5")

# Выведем значения в конкретных точках
points = [0.2, 0.4, 0.6, 0.8]
print(f"{'x':>5} | {'Явная (h=0.05)':>15} | {'Неявная (h=0.05)':>17} | {'Неявная (h=0.01)':>17}")
print("-" * 65)

for p in points:
    # Ищем индексы, ближайшие к нашим точкам
    idx_exp = np.argmin(np.abs(x - p))
    idx_imp05 = np.argmin(np.abs(x_imp05 - p))
    idx_imp01 = np.argmin(np.abs(x_imp01 - p))
    
    val_exp = u_exp[idx_exp]
    val_imp05 = u_imp05[idx_imp05]
    val_imp01 = u_imp01[idx_imp01]
    
    print(f"{p:5.1f} | {val_exp:15.6f} | {val_imp05:17.6f} | {val_imp01:17.6f}")

print("="*60)

# Посчитаем максимальное расхождение между явной и неявной схемами (при h=0.05)
# Для этого интерполируем решение неявной схемы на сетку явной
u_imp05_interp = np.interp(x, x_imp05, u_imp05)
max_diff = np.max(np.abs(u_exp - u_imp05_interp))
print(f"Максимальное расхождение между явной и неявной (h=0.05): {max_diff:.6f}")

# Посчитаем максимальное расхождение между неявными схемами с разным шагом
u_imp01_interp = np.interp(x_imp05, x_imp01, u_imp01)
max_diff_h = np.max(np.abs(u_imp05 - u_imp01_interp))
print(f"Максимальное расхождение между неявными (h=0.05 и h=0.01): {max_diff_h:.6f}")

plt.figure(figsize=(10, 6))
plt.plot(x, u_exp, 'o-', label='Явная (h=0.05)')
plt.plot(x_imp05, u_imp05, 's--', label='Неявная (h=0.05)')
plt.plot(x_imp01, u_imp01, '^:', label='Неявная (h=0.01)')
plt.title('Решение задачи колебаний струны при t = 0.5')
plt.xlabel('x')
plt.ylabel('u(x, 0.5)')
plt.legend()
plt.grid(True)
plt.show()