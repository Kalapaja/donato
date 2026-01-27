import type { Translations } from "../services/I18nService.ts";

/**
 * Russian translations
 */
export const ru: Translations = {
  // Widget header & general
  "widget.header.title": "ПОДДЕРЖАТЬ",
  "widget.loading": "Загрузка виджета...",
  "widget.footer.contact": "Связаться с разработчиками",

  // Donation type toggle
  "donation.type.oneTime": "Разовый",
  "donation.type.monthly": "Непрерывный",

  // Amount section
  "amount.tooltip": "Любой токен, любая сеть — автоконвертация",
  "amount.helper": "Какую сумму вы хотите пожертвовать?",
  "amount.helper.subscription": "Сумма ежемесячной подписки",
  "subscription.duration.estimate":
    "Примерная продолжительность на основе депозита",
  "amount.ariaLabel": "Сумма пожертвования",
  "amount.presetAriaLabel": "Установить сумму {currency}{amount}",

  // Wallet connection
  "wallet.connecting": "Подключение...",
  "wallet.connect": "Подключить кошелёк",
  "wallet.connectSubtext":
    "Безопасно. Средства переводятся только с вашего подтверждения",
  "wallet.connectAriaLabel": "Подключить кошелёк",
  "wallet.disconnectAriaLabel": "Отключить кошелёк",
  "wallet.switchNetworkAriaLabel": "Сменить сеть",

  // Wallet security tooltip
  "wallet.security.title": "Это безопасно?",
  "wallet.security.viewOnly": "Подключение только показывает ваш баланс",
  "wallet.security.noAutoDebit": "Автоматических списаний нет",
  "wallet.security.confirmRequired":
    "Каждая транзакция требует вашего подтверждения",

  // Donate button
  "donate.processing": "Обработка...",
  "donate.calculating": "Расчёт...",
  "donate.pay": "Оплатить",
  "donate.payWithAmount": "Оплатить {amount} {token}",
  "donate.processingAriaLabel": "Обработка платежа, пожалуйста подождите",
  "donate.calculatingAriaLabel": "Расчёт суммы платежа, пожалуйста подождите",
  "donate.disabledAriaLabel": "кнопка неактивна",

  // Button states
  "button.processing": "Обработка...",
  "button.calculating": "Расчёт...",
  "button.donate": "Пожертвовать",
  "button.subscribe": "Подписаться",

  // Success state
  "success.defaultMessage": "Спасибо за ваше пожертвование!",
  "success.subscription.message": "Подписка активирована!",
  "success.donateAgain": "Пожертвовать снова",
  "success.youDonated": "Вы пожертвовали {amount}",
  "success.amount": "Сумма",
  "success.network": "Сеть",
  "success.recipient": "Получатель",
  "success.time": "Время",
  "success.transactionDetails": "Детали транзакции",

  // Token selection
  "token.choosePayment": "Выберите токен для оплаты",
  "token.insufficientBalance": "недостаточный баланс",
  "token.selectionAriaLabel": "Выбор токена",
  "token.noTokensWithBalance": "Нет токенов с балансом",
  "token.noTokensWithBalanceHint": "Пополните кошелёк для пожертвования",
  "token.supportedTokensIntro": "Поддерживаемые токены для доната:",
  "token.supportedNetworks":
    "Сети: Ethereum, Polygon, Arbitrum, BSC, Optimism, Base",

  // Toast notifications
  "toast.successAriaLabel": "Уведомление об успехе",
  "toast.errorAriaLabel": "Уведомление об ошибке",
  "toast.warningAriaLabel": "Предупреждение",
  "toast.infoAriaLabel": "Информационное уведомление",
  "toast.closeAriaLabel": "Закрыть уведомление",

  // Messages
  "message.donationSuccess":
    "Пожертвование успешно! Спасибо за вашу поддержку.",
  "message.invalidRecipient": "Неверный формат адреса получателя",
  "message.initFailed": "Не удалось инициализировать виджет",
  "message.walletConnectionFailed": "Не удалось открыть подключение кошелька",

  // Error messages
  "error.networkConnection":
    "Не удалось связаться с сервером. Проверьте подключение к интернету.",
  "error.networkSwitchFailed": "Переключитесь на {network}",
  "error.invalidParams":
    "Неверные параметры запроса. Попробуйте другую сумму или токен.",
  "error.routeNotFound": "Маршрут не найден. Попробуйте другой токен.",
  "error.serverUnavailable": "Сервер временно недоступен. Попробуйте позже.",
  "error.unsupportedNetwork": "Сеть не поддерживается.",
  "error.unsupportedToken": "Токен не поддерживается.",
  "error.insufficientLiquidity": "Недостаточно ликвидности для этого обмена.",
  "error.insufficientFunds": "Недостаточно средств в вашем кошельке.",
  "error.slippageTooHigh": "Слишком высокое проскальзывание для этого обмена.",
  "error.transactionRejected": "Транзакция отклонена пользователем.",
  "error.signatureRejected": "Подпись отклонена пользователем.",
  "error.subscriptionFailed": "Не удалось создать подписку. Попробуйте снова.",
  "error.walletNotConnected": "Сначала подключите кошелёк.",
  "error.switchToPolygon":
    "Пожалуйста, переключитесь на сеть Polygon в кошельке для подписи подписки.",
  "error.uniswapNoPool": "Пул ликвидности для этой пары токенов не найден",
  "error.uniswapSlippage": "Цена изменилась слишком сильно. Попробуйте снова",
  "error.uniswapSwapFailed": "Обмен не удался. Попробуйте снова",

  // Subscription overlay
  "subscription.overlay.title": "Настройка подписки",
  "subscription.overlay.description":
    "Пожалуйста, следуйте инструкциям в кошельке",
  "subscription.overlay.hint": "Нажмите, чтобы начать процесс подписки",

  // Subscription steps
  "subscription.step.switching": "Переключение на Polygon",
  "subscription.step.switching.desc": "Подтвердите смену сети",
  "subscription.step.signing": "Подписание подписки",
  "subscription.step.signing.desc": "Подпишите запрос на подписку",
  "subscription.step.building": "Подготовка транзакции",
  "subscription.step.building.desc": "Построение действий подписки...",
  "subscription.step.returning": "Переключение сети",
  "subscription.step.returning.desc": "Возврат к исходной сети",
  "subscription.step.quoting": "Расчёт котировки",
  "subscription.step.quoting.desc": "Получение лучшего курса",
  "subscription.step.approving": "Одобрение токена",
  "subscription.step.approving.desc": "Подтвердите перевод токенов",
  "subscription.step.subscribing": "Подтверждение подписки",
  "subscription.step.subscribing.desc": "Подтвердите транзакцию",
  "subscription.step.confirming": "Ожидание подтверждения",
  "subscription.step.confirming.desc":
    "Транзакция отправлена, ожидание подтверждения",

  // Subscription setup screen
  "subscription.setup.title": "Как работают непрерывные платежи",
  "subscription.setup.subtitle":
    "Ваша поддержка поступает непрерывно — каждую секунду",
  "subscription.setup.yourDeposit": "Ваш депозит",
  "subscription.setup.recipient": "Получатель",
  "subscription.setup.step1.title": "Подпишите разрешение",
  "subscription.setup.step1.description":
    "Бесплатно и безопасно — транзакция не отправляется",
  "subscription.setup.step2.title": "Внесите депозит",
  "subscription.setup.step2.description":
    "Ваш депозит — ваш контроль. Выводите когда угодно",
  "subscription.setup.step3.title": "Платежи начинаются",
  "subscription.setup.step3.description":
    "Средства поступают каждую секунду с вашего баланса",
  "subscription.setup.depositLabel": "На сколько месяцев внести депозит?",
  "subscription.setup.month": "месяц",
  "subscription.setup.months": "месяцев",
  "subscription.setup.monthlyPayment": "Ежемесячный платёж",
  "subscription.setup.totalDeposit": "Сумма депозита",
  "subscription.setup.refundNotice":
    "Неиспользованные средства можно вывести в любое время через Papaya Finance.",
  "subscription.setup.back": "Назад",
  "subscription.setup.continue": "Продолжить",
  "subscription.setup.monthDefinition": "1 месяц = 30 дней",

  // Subscription progress screen
  "subscription.progress.title": "Создание подписки",
  "subscription.progress.subtitle": "Следуйте инструкциям в вашем кошельке",
  "subscription.progress.monthlyAmount": "Ежемесячно",
  "subscription.progress.depositAmount": "Депозит",
  "subscription.progress.retry": "Попробовать снова",
  "subscription.progress.switching": "Переключение на Polygon",
  "subscription.progress.switching.desc": "Подписки работают в сети Polygon",
  "subscription.progress.signing": "Подписание разрешения",
  "subscription.progress.signing.desc":
    "Эта подпись авторизует подписку без отправки транзакции",
  "subscription.progress.building": "Подготовка транзакции",
  "subscription.progress.building.desc":
    "Формирование данных для кросс-чейн перевода",
  "subscription.progress.returning": "Возврат на исходную сеть",
  "subscription.progress.returning.desc": "Переключение обратно для оплаты",
  "subscription.progress.quoting": "Расчёт курса",
  "subscription.progress.quoting.desc": "Получение лучшего курса конвертации",
  "subscription.progress.approving": "Одобрение токена",
  "subscription.progress.approving.desc":
    "Разрешение протоколу использовать токены для свапа",
  "subscription.progress.subscribing": "Подтверждение транзакции",
  "subscription.progress.subscribing.desc":
    "Эта транзакция создаст вашу подписку",
  "subscription.progress.confirming": "Ожидание подтверждения",
  "subscription.progress.confirming.desc":
    "Транзакция отправлена, ожидание подтверждения в блокчейне",

  // Success screen - subscription management
  "success.subscription.manageText": "Управляйте подпиской в любое время",
  "success.subscription.manageLink": "Открыть Papaya Finance",
  "success.subscription.cancelHint":
    "Вы можете отменить подписку и вывести остаток средств в любое время",

  // Existing subscription indicator
  "subscription.existing.message": "Уже подписаны (${amount}/мес)",
  "subscription.existing.manage": "Управлять в Papaya Finance",
};
